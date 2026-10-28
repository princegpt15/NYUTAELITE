#!/usr/bin/env node
/**
 * Phase 6 — Indexing Queue Manager
 *
 * Sitemap-driven canonical URL queue for tracking indexing status.
 * Implements deduplication, history tracking, and status reporting.
 *
 * Strategy:
 *   - Reads canonical URLs from sitemap.xml
 *   - Deduplicates against history file
 *   - Submits sitemap URL to Google Search Console via API (NOT Indexing API)
 *   - Verifies HTTP status of each canonical URL
 *   - Writes queue state to seo-reports/indexing-queue-YYYY-MM-DD.json
 *
 * IMPORTANT: The Google Indexing API is NOT used here.
 * Standard e-commerce product pages are not eligible for the Indexing API.
 * This script uses the GSC Sitemaps API to notify Google, and live HTTP
 * checks to verify URLs are reachable.
 *
 * Usage: node scripts/seo-engine/indexing-queue.mjs [--dry-run]
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const REPORT_DIR = path.join(ROOT, 'scripts', 'seo-reports');
const HISTORY_FILE = path.join(REPORT_DIR, 'indexing-history.json');
const ORIGIN = 'https://nyutaelite.com';
const SITEMAP_URL = `${ORIGIN}/sitemap.xml`;
const GSC_PROPERTY = 'sc-domain:nyutaelite.com';
const DRY_RUN = process.argv.includes('--dry-run');

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'Googlebot/2.1', ...headers },
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ── Parse sitemap ─────────────────────────────────────────────────────────────

async function fetchSitemapUrls() {
  console.log(`📥  Fetching sitemap: ${SITEMAP_URL}`);
  const res = await httpsGet(SITEMAP_URL);
  if (res.status !== 200) {
    throw new Error(`Sitemap returned HTTP ${res.status}`);
  }
  const urls = [];
  for (const m of res.body.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    urls.push(m[1].trim());
  }
  console.log(`   Found ${urls.length} URLs in sitemap`);
  return urls;
}

// ── Live HTTP status check ────────────────────────────────────────────────────

async function checkUrl(url) {
  try {
    const res = await httpsGet(url);
    const title = (res.body.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const canonical = (res.body.match(/rel="canonical"[^>]*href="([^"]*)"/) || [])[1] || '';
    const hasSchema = res.body.includes('application/ld+json');
    return {
      url,
      httpStatus: res.status,
      title: title.trim(),
      canonical: canonical.trim(),
      hasSchema,
      ok: res.status === 200,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { url, httpStatus: 0, ok: false, error: err.message, checkedAt: new Date().toISOString() };
  }
}

// ── Load / save history ───────────────────────────────────────────────────────

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch { return {}; }
  }
  return {};
}

function saveHistory(history) {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

// ── GSC Sitemap submission ────────────────────────────────────────────────────

async function getServiceAccountToken() {
  let rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) {
    const credPaths = [
      path.join(ROOT, 'credentials', 'gsc-key.json'),
      path.join(ROOT, 'credentials', 'nyutaelite-seo-bot.json'),
    ];
    for (const p of credPaths) {
      if (fs.existsSync(p)) { rawJson = fs.readFileSync(p, 'utf8'); break; }
    }
  }
  if (!rawJson) return null;

  const { default: crypto } = await import('node:crypto');
  const sa = JSON.parse(rawJson);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.access_token) resolve(json.access_token);
        else reject(new Error(`Token error: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function submitSitemapToGsc(token) {
  if (!token) {
    console.log('⚠️   No GSC credentials — skipping sitemap submission');
    return null;
  }
  const encodedProperty = encodeURIComponent(GSC_PROPERTY);
  const encodedSitemap = encodeURIComponent(SITEMAP_URL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/webmasters/v3/sites/${encodedProperty}/sitemaps/${encodedSitemap}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Length': 0 },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔄  NYUTAELITE — Indexing Queue Manager`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no GSC submission)' : 'LIVE'}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  // 1. Fetch sitemap URLs
  const sitemapUrls = await fetchSitemapUrls();
  const history = loadHistory();

  // 2. Check HTTP status for each URL
  console.log('\n📡  Checking live HTTP status for all sitemap URLs…');
  const results = [];
  for (const url of sitemapUrls) {
    process.stdout.write(`   Checking: ${url.replace(ORIGIN, '')} … `);
    const result = await checkUrl(url);
    process.stdout.write(`HTTP ${result.httpStatus} ${result.ok ? '✅' : '❌'}\n`);
    results.push(result);

    // Update history
    history[url] = {
      ...history[url],
      lastChecked: result.checkedAt,
      lastStatus: result.httpStatus,
      lastTitle: result.title,
      lastCanonical: result.canonical,
      hasSchema: result.hasSchema,
      checkCount: (history[url]?.checkCount || 0) + 1,
    };
  }

  // 3. Submit sitemap to GSC (not individual URLs)
  if (!DRY_RUN) {
    console.log('\n📤  Submitting sitemap to Google Search Console…');
    try {
      const token = await getServiceAccountToken();
      const submission = await submitSitemapToGsc(token);
      if (submission) {
        console.log(`   GSC Sitemaps API response: HTTP ${submission.status}`);
        if (submission.status === 200 || submission.status === 204) {
          console.log('   ✅  Sitemap submitted successfully');
          history['_lastSitemapSubmission'] = new Date().toISOString();
          history['_sitemapSubmissionStatus'] = submission.status;
        } else {
          console.log(`   ⚠️   Unexpected status: ${submission.body}`);
        }
      }
    } catch (err) {
      console.log(`   ❌  GSC submission failed: ${err.message}`);
    }
  } else {
    console.log('\n⏭️   DRY RUN: Skipping GSC sitemap submission');
  }

  // 4. Save history and report
  saveHistory(history);

  const reportData = {
    generatedAt: new Date().toISOString(),
    totalUrls: sitemapUrls.length,
    passing: results.filter(r => r.ok).length,
    failing: results.filter(r => !r.ok).length,
    results,
    dryRun: DRY_RUN,
  };
  const reportFile = path.join(REPORT_DIR, `indexing-queue-${new Date().toISOString().slice(0, 10)}.json`);
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2), 'utf8');
  console.log(`\n✅  Indexing queue report saved → ${reportFile}`);

  // 5. Summary
  console.log(`\n📊  SUMMARY`);
  console.log(`   Total sitemap URLs: ${sitemapUrls.length}`);
  console.log(`   HTTP 200 OK:        ${reportData.passing}`);
  console.log(`   Failed:             ${reportData.failing}`);
  if (reportData.failing > 0) {
    console.log('\n   ❌  Failing URLs:');
    results.filter(r => !r.ok).forEach(r => console.log(`      ${r.url} → HTTP ${r.httpStatus}`));
    process.exit(1);
  }
}

main().catch(err => {
  console.error('✖  Indexing queue error:', err.message);
  process.exit(1);
});

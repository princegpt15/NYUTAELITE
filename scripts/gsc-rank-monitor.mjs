// scripts/gsc-rank-monitor.mjs
/**
 * Phase 15 — Google Search Console (GSC) Weekly Rank Monitor
 * ──────────────────────────────────────────────────────────
 * Queries GSC API for top-10 ranking queries and page-level
 * performance data, then writes a weekly report to logs/.
 *
 * Requirements:
 *   GOOGLE_SERVICE_ACCOUNT_JSON env var must be set to the JSON
 *   content (not path) of a GSC-authorised service account key.
 *   See .env.example for setup instructions.
 *
 * Usage:
 *   node scripts/gsc-rank-monitor.mjs
 *
 * Graceful degradation:
 *   If GOOGLE_SERVICE_ACCOUNT_JSON is not set, the script logs a
 *   human-readable setup guide and exits 0 (never breaks CI).
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOG_DIR = path.join(ROOT, 'scripts', 'seo-reports');
const SITE_URL = 'sc-domain:nyutaelite.com'; // GSC property (domain property)

// ── Utility helpers ─────────────────────────────────────────────────────────

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function getAccessToken(serviceAccount) {
  // Build JWT for service account auth
  const { default: crypto } = await import('node:crypto');

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          const json = JSON.parse(data);
          if (json.access_token) resolve(json.access_token);
          else reject(new Error(`Token error: ${data}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function gscQuery(accessToken, requestBody) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(requestBody);
    const encodedSite = encodeURIComponent(SITE_URL);
    const req = https.request(
      {
        hostname: 'www.googleapis.com',
        path: `/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON parse error: ${data}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Queries to run weekly ────────────────────────────────────────────────────

async function runGscQueries(token) {
  const endDate = isoDate(3); // GSC data lags ~3 days
  const startDate = isoDate(10); // last 7 days of available data

  // 1. Top queries overall
  const topQueries = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['query'],
    rowLimit: 25,
    dataState: 'final',
  });

  // 2. Per-page performance
  const perPage = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['page'],
    rowLimit: 20,
    dataState: 'final',
  });

  // 3. Brand vs non-brand (makhana queries)
  const makhanaQueries = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['query'],
    rowLimit: 50,
    dataState: 'final',
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'query',
        operator: 'contains',
        expression: 'makhana',
      }]
    }],
  });

  // 4. Mobile vs Desktop
  const byDevice = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['device'],
    rowLimit: 3,
    dataState: 'final',
  });

  // 5. Learn articles performance
  const learnPages = await gscQuery(token, {
    startDate, endDate,
    dimensions: ['page'],
    rowLimit: 10,
    dataState: 'final',
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'page',
        operator: 'contains',
        expression: '/learn/',
      }]
    }],
  });

  return { topQueries, perPage, makhanaQueries, byDevice, learnPages, startDate, endDate };
}

// ── Report formatter ─────────────────────────────────────────────────────────

function formatReport(data) {
  const { topQueries, perPage, makhanaQueries, byDevice, learnPages, startDate, endDate } = data;
  const timestamp = new Date().toISOString();

  function fmtRow(row) {
    const keys = row.keys ? row.keys.join(' | ') : '—';
    return `  ${keys.padEnd(55)} Clicks:${String(row.clicks).padStart(5)}  Impr:${String(row.impressions).padStart(6)}  CTR:${(row.ctr * 100).toFixed(1).padStart(5)}%  Pos:${row.position.toFixed(1).padStart(5)}`;
  }

  const lines = [
    `═══════════════════════════════════════════════════════════════`,
    `  NYUTAELITE.COM — Weekly GSC Rank Report`,
    `  Generated: ${timestamp}`,
    `  Date Range: ${startDate} → ${endDate}`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `── TOP 25 QUERIES ──────────────────────────────────────────────`,
    ...((topQueries.rows || []).map(fmtRow)),
    ``,
    `── PER-PAGE PERFORMANCE ────────────────────────────────────────`,
    ...((perPage.rows || []).map(fmtRow)),
    ``,
    `── MAKHANA-SPECIFIC QUERIES ────────────────────────────────────`,
    ...((makhanaQueries.rows || []).map(fmtRow)),
    ``,
    `── BY DEVICE ───────────────────────────────────────────────────`,
    ...((byDevice.rows || []).map(fmtRow)),
    ``,
    `── LEARN ARTICLES ──────────────────────────────────────────────`,
    ...((learnPages.rows || []).map(fmtRow)),
    ``,
    `═══════════════════════════════════════════════════════════════`,
    ``,
  ];

  return lines.join('\n');
}

// ── Setup guide (shown when credentials are missing) ─────────────────────────

function printSetupGuide() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║          GSC Rank Monitor — Setup Required                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  GOOGLE_SERVICE_ACCOUNT_JSON is not set.                         ║
║  Follow these steps to enable weekly rank tracking:              ║
║                                                                  ║
║  1. Go to: console.cloud.google.com                              ║
║  2. Create a project (or use an existing one)                    ║
║  3. Enable the "Google Search Console API"                       ║
║  4. IAM → Service Accounts → Create Service Account             ║
║     Name: nyutaelite-gsc-reader                                  ║
║  5. Create a JSON key → download the .json file                  ║
║  6. In GSC (search.google.com/search-console):                   ║
║     Settings → Users & permissions → Add user                   ║
║     Email: <service-account-email>@<project>.iam.gserviceaccount.com ║
║     Permission: Restricted (read-only is fine)                   ║
║  7. Set the env variable:                                        ║
║     In Cloudflare Pages dashboard:                               ║
║       Settings → Environment variables → Add:                   ║
║       Name:  GOOGLE_SERVICE_ACCOUNT_JSON                         ║
║       Value: <paste the entire contents of the .json key file>  ║
║     Locally (for testing):                                       ║
║       Add to .env (never commit this file!):                     ║
║       GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...} ║
║  8. Run: node scripts/gsc-rank-monitor.mjs                      ║
║                                                                  ║
║  See .env.example for the exact variable format.                 ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawJson) {
    printSetupGuide();
    console.log('ℹ  Skipping GSC query — no credentials. Exiting cleanly.');
    process.exit(0);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawJson);
  } catch (e) {
    console.error('✖  GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON:', e.message);
    process.exit(1);
  }

  console.log('🔑  Getting access token…');
  const token = await getAccessToken(serviceAccount);

  console.log('📊  Querying GSC API…');
  const data = await runGscQueries(token);

  const report = formatReport(data);
  console.log(report);

  // Write to log file
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  const reportFile = path.join(LOG_DIR, `gsc-weekly-${isoDate()}.txt`);
  fs.writeFileSync(reportFile, report, 'utf8');
  console.log(`✅  Report saved → ${reportFile}`);

  // Append summary line to daily health log
  const summary = `[${new Date().toISOString()}] GSC Weekly Report: ${(data.topQueries.rows || []).length} queries tracked. Report: ${reportFile}\n`;
  fs.appendFileSync(path.join(ROOT, 'scripts', 'daily_health.log'), summary);
}

main().catch((err) => {
  console.error('✖  GSC monitor error:', err.message);
  process.exit(1);
});

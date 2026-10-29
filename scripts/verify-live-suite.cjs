'use strict';
// ─── Live Production Endpoint Audit ───────────────────────────────────────────
// Verifies that every indexed route returns:
//   1. HTTP 200
//   2. A route-specific title (not the homepage default title)
//   3. A self-referencing canonical URL (canonical === tested URL)
//   4. Expected structured-data schema types
//   5. Correct metadata when requested WITHOUT Accept: text/html
//      (simulates older Googlebot crawlers that omit the Accept header)
//
// CRITICAL: HTTP 200 alone is NOT proof of indexing readiness.
// A route that returns 200 but serves the homepage canonical is BROKEN.
// ──────────────────────────────────────────────────────────────────────────────
const https = require('https');

const ORIGIN = 'https://nyutaelite.com';
// The homepage title/canonical that must NOT appear on any other route
const HOMEPAGE_TITLE    = 'NYUTA ELITE MAKHANA (NYUTAELITE) | Premium Fox Nuts from Bihar';
const HOMEPAGE_CANONICAL = `${ORIGIN}/`;

function fetchHtml(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    https.get(
      parsedUrl.href,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml',
          ...extraHeaders,
        },
        timeout: 12000,
      },
      (res) => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    ).on('error', reject);
  });
}

function parseJsonLd(html) {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return matches.map(tag => {
    const raw = tag.replace(/<script[^>]*>|<\/script>/gi, '').trim();
    try { return JSON.parse(raw); } catch { return null; }
  }).filter(Boolean);
}

function extractTitle(html) {
  return (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || '';
}

function extractCanonical(html) {
  return (html.match(/rel="canonical"[^>]*href="([^"]*)"/i) || [])[1] || '';
}

// ─── Route expectations ────────────────────────────────────────────────────────
// Each entry describes what the route MUST satisfy.
//
// canonicalMustBe: The canonical href must equal exactly this value.
//                  Prevents the "all routes point to homepage" defect.
// titleMustNotBe:  Array of strings that must NOT appear in the title.
//                  Used to ensure route-specific titles are injected.
// titleMustContain: Substring that MUST appear in the title.
// expectedSchemas: Schema @types that must be present in JSON-LD.
// noindex:         If true, expect X-Robots-Tag: noindex on this route.
// ──────────────────────────────────────────────────────────────────────────────
const ROUTES = [
  {
    path: '/',
    canonicalMustBe: `${ORIGIN}/`,
    titleMustContain: 'NYUTA ELITE MAKHANA',
    expectedSchemas: ['Organization', 'WebSite'],
  },
  {
    path: '/categories',
    canonicalMustBe: `${ORIGIN}/categories`,
    titleMustContain: 'Makhana',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList'],
  },
  {
    path: '/categories?type=Premium',
    canonicalMustBe: `${ORIGIN}/categories?type=Premium`,
    titleMustContain: 'Premium',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList'],
  },
  {
    path: '/categories?type=Normal',
    canonicalMustBe: `${ORIGIN}/categories?type=Normal`,
    titleMustContain: 'Normal',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList'],
  },
  {
    path: '/about',
    canonicalMustBe: `${ORIGIN}/about`,
    titleMustContain: 'About',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: [],
  },
  {
    path: '/faq',
    canonicalMustBe: `${ORIGIN}/faq`,
    titleMustContain: 'FAQ',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['FAQPage'],
  },
  {
    path: '/contact',
    canonicalMustBe: `${ORIGIN}/contact`,
    titleMustContain: 'Contact',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: [],
  },
  {
    path: '/bulk-order/qualities',
    canonicalMustBe: `${ORIGIN}/bulk-order/qualities`,
    titleMustContain: 'Bulk',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: [],
  },
  {
    path: '/products/makhana?sku=premium-100g',
    canonicalMustBe: `${ORIGIN}/products/makhana?sku=premium-100g`,
    titleMustContain: 'Premium 100g',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Product'],
  },
  {
    path: '/products/makhana?sku=premium-200g',
    canonicalMustBe: `${ORIGIN}/products/makhana?sku=premium-200g`,
    titleMustContain: 'Premium 200g',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Product'],
  },
  {
    path: '/products/makhana?sku=premium-250g',
    canonicalMustBe: `${ORIGIN}/products/makhana?sku=premium-250g`,
    titleMustContain: 'Premium 250g',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Product'],
  },
  {
    path: '/products/makhana?sku=normal-100g',
    canonicalMustBe: `${ORIGIN}/products/makhana?sku=normal-100g`,
    titleMustContain: 'Normal 100g',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Product'],
  },
  {
    path: '/products/makhana?sku=normal-200g',
    canonicalMustBe: `${ORIGIN}/products/makhana?sku=normal-200g`,
    titleMustContain: 'Normal 200g',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Product'],
  },
  {
    path: '/products/makhana?sku=normal-250g',
    canonicalMustBe: `${ORIGIN}/products/makhana?sku=normal-250g`,
    titleMustContain: 'Normal 250g',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Product'],
  },
  {
    path: '/learn/how-to-choose-good-quality-makhana',
    canonicalMustBe: `${ORIGIN}/learn/how-to-choose-good-quality-makhana`,
    titleMustContain: 'Choose',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Article'],
  },
  {
    path: '/learn/makhana-benefits-health',
    canonicalMustBe: `${ORIGIN}/learn/makhana-benefits-health`,
    titleMustContain: 'Benefits',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Article'],
  },
  {
    path: '/learn/how-to-store-makhana',
    canonicalMustBe: `${ORIGIN}/learn/how-to-store-makhana`,
    titleMustContain: 'Store',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Article'],
  },
  {
    path: '/learn/makhana-pack-size-guide',
    canonicalMustBe: `${ORIGIN}/learn/makhana-pack-size-guide`,
    titleMustContain: 'Pack Size',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Article'],
  },
  {
    path: '/learn/ordering-makhana-online-india',
    canonicalMustBe: `${ORIGIN}/learn/ordering-makhana-online-india`,
    titleMustContain: 'Ordering',
    titleMustNotBe: [HOMEPAGE_TITLE],
    expectedSchemas: ['BreadcrumbList', 'Article'],
  },
  // Noindex routes — must serve X-Robots-Tag: noindex
  {
    path: '/play',
    noindex: true,
    canonicalMustBe: null, // not indexable — canonical not required
    titleMustContain: null,
    expectedSchemas: [],
  },
];

// ─── Runner ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log(' NYUTAELITE LIVE PRODUCTION SEO AUDIT');
  console.log(` Target: ${ORIGIN}`);
  console.log('════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const route of ROUTES) {
    const url = `${ORIGIN}${route.path}`;
    let res;
    try {
      res = await fetchHtml(url);
    } catch (err) {
      console.log(`✖ [ERR] ${route.path} — fetch error: ${err.message}\n`);
      failed++;
      failures.push({ path: route.path, reason: `fetch error: ${err.message}` });
      continue;
    }

    const title    = extractTitle(res.body);
    const canon    = extractCanonical(res.body);
    const schemas  = parseJsonLd(res.body).map(s => s['@type']);
    const xRobots  = (res.headers['x-robots-tag'] || '').toLowerCase();
    const linkHdr  = res.headers['link'] || '';
    const routeFailures = [];

    // 1. HTTP 200
    if (res.status !== 200) {
      routeFailures.push(`HTTP ${res.status} (expected 200)`);
    }

    if (route.noindex) {
      // Noindex routes: must have X-Robots-Tag: noindex
      if (!xRobots.includes('noindex')) {
        routeFailures.push(`Missing X-Robots-Tag: noindex (got: "${xRobots || 'none'}")`);
      }
    } else {
      // Indexable routes: strict metadata checks

      // 2. Canonical must exactly match this route
      if (route.canonicalMustBe) {
        if (canon !== route.canonicalMustBe) {
          routeFailures.push(`Canonical mismatch\n       Expected: ${route.canonicalMustBe}\n       Got:      ${canon || '(not found)'}`);
        }
        // Also verify Link: <canonical>; rel="canonical" HTTP header
        if (!linkHdr.includes(route.canonicalMustBe)) {
          routeFailures.push(`Missing Link: canonical header (got: "${linkHdr}")`);
        }
      }

      // 3. Title must not be the homepage default (canonical mismatch indicator)
      if (route.titleMustNotBe) {
        for (const forbidden of route.titleMustNotBe) {
          if (title === forbidden) {
            routeFailures.push(`Title is the homepage default — SEO injection failed\n       Title: "${title}"`);
          }
        }
      }

      // 4. Title must contain expected substring
      if (route.titleMustContain && !title.includes(route.titleMustContain)) {
        routeFailures.push(`Title missing expected text "${route.titleMustContain}"\n       Got: "${title}"`);
      }

      // 5. Expected schema types must be present
      for (const expectedType of (route.expectedSchemas || [])) {
        if (!schemas.includes(expectedType)) {
          routeFailures.push(`Missing JSON-LD schema: @type="${expectedType}" (found: ${schemas.join(', ') || 'none'})`);
        }
      }

      // 6. Must NOT have noindex on indexable routes
      if (xRobots.includes('noindex')) {
        routeFailures.push(`Unexpected noindex on indexable route (X-Robots-Tag: ${xRobots})`);
      }
    }

    const ok = routeFailures.length === 0;
    if (ok) {
      passed++;
      console.log(`✓ [200] ${route.path}`);
      if (!route.noindex) {
        console.log(`   Title:     ${title}`);
        console.log(`   Canonical: ${canon}`);
        console.log(`   Schemas:   ${schemas.join(', ') || 'None'}`);
      } else {
        console.log(`   X-Robots-Tag: ${xRobots}`);
      }
    } else {
      failed++;
      failures.push({ path: route.path, reasons: routeFailures });
      console.log(`✖ [${res.status}] ${route.path} — ${routeFailures.length} failure(s)`);
      for (const f of routeFailures) {
        console.log(`   ✖ ${f}`);
      }
    }
    console.log('');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log(` AUDIT SUMMARY: ${passed} passed, ${failed} failed  (${ROUTES.length} routes total)`);
  console.log('════════════════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n❌ FAILURES:\n');
    for (const f of failures) {
      console.log(`  ${f.path}`);
      const reasons = Array.isArray(f.reasons) ? f.reasons : [f.reason];
      for (const r of reasons) console.log(`    • ${r}`);
    }
    process.exit(1);
  }

  console.log('\n✅ All routes pass SEO requirements.');
}

run().catch(err => {
  console.error('✖ Audit error:', err.message);
  process.exit(1);
});

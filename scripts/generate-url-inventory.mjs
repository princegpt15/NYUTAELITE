#!/usr/bin/env node
/**
 * Phase 3 — URL Indexing Inventory Generator
 * Builds url-indexing-inventory.csv from:
 *   - sitemap.xml (canonical indexed set)
 *   - _worker.js known routes (application routes)
 *   - robots.txt (blocked routes)
 *
 * Categories:
 *   A  Indexed — homepage
 *   B  Indexed — commercial (products / categories)
 *   C  Indexed — informational (learn articles)
 *   D  Indexed — utility (about, faq, contact, bulk-order)
 *   E  Indexed — parameterised (sku/type variants)
 *   F  Noindex — private / transactional
 *   G  Noindex — interactive / non-crawl
 *   H  Blocked — robots.txt Disallow
 *   I  Sitemap only — not found in worker routes
 *   J  Worker only — not in sitemap
 *   K  Unknown — not in either
 *
 * Usage: node scripts/generate-url-inventory.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'scripts', 'seo-reports');
const ORIGIN = 'https://nyutaelite.com';

// ── 1. Parse sitemap.xml ──────────────────────────────────────────────────────
const sitemapXml = fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8');
const sitemapUrls = new Set();
for (const m of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  sitemapUrls.add(m[1].trim());
}

// ── 2. Canonical application routes (from verify-live-suite.cjs) ─────────────
const APP_ROUTES = [
  { path: '/',                                   label: 'Homepage',                     category: 'A' },
  { path: '/categories',                         label: 'Shop All Makhana',             category: 'B' },
  { path: '/categories?type=Premium',            label: 'Premium Category Filter',      category: 'E' },
  { path: '/categories?type=Normal',             label: 'Normal Category Filter',       category: 'E' },
  { path: '/products/makhana',                   label: 'Makhana Collection',           category: 'B' },
  { path: '/products/makhana?sku=premium-100g',  label: 'Premium Makhana 100g',         category: 'E' },
  { path: '/products/makhana?sku=premium-200g',  label: 'Premium Makhana 200g',         category: 'E' },
  { path: '/products/makhana?sku=premium-250g',  label: 'Premium Makhana 250g',         category: 'E' },
  { path: '/products/makhana?sku=normal-100g',   label: 'Normal Makhana 100g',          category: 'E' },
  { path: '/products/makhana?sku=normal-200g',   label: 'Normal Makhana 200g',          category: 'E' },
  { path: '/products/makhana?sku=normal-250g',   label: 'Normal Makhana 250g',          category: 'E' },
  { path: '/about',                              label: 'About NYUTA ELITE',            category: 'D' },
  { path: '/faq',                                label: 'FAQ',                          category: 'D' },
  { path: '/contact',                            label: 'Contact',                      category: 'D' },
  { path: '/bulk-order/qualities',               label: 'Bulk Order Qualities',         category: 'D' },
  { path: '/learn/how-to-choose-good-quality-makhana', label: 'Learn: Choose Quality', category: 'C' },
  { path: '/learn/makhana-benefits-health',      label: 'Learn: Health Benefits',       category: 'C' },
  { path: '/learn/how-to-store-makhana',         label: 'Learn: Storage Guide',         category: 'C' },
  { path: '/learn/makhana-pack-size-guide',      label: 'Learn: Pack Size Guide',       category: 'C' },
  { path: '/learn/ordering-makhana-online-india', label: 'Learn: Ordering Guide',       category: 'C' },
  // Noindex / private routes
  { path: '/play',                               label: 'Interactive Stories (noindex)',       category: 'G' },
  { path: '/cart',                               label: 'Cart (noindex)',                      category: 'F' },
  { path: '/checkout',                           label: 'Checkout (noindex)',                  category: 'F' },
  { path: '/orders',                             label: 'Orders (noindex)',                    category: 'F' },
  { path: '/account',                            label: 'Account (noindex)',                   category: 'F' },
  { path: '/wishlist',                           label: 'Wishlist (noindex)',                  category: 'F' },
  { path: '/login',                              label: 'Login (noindex)',                     category: 'F' },
  { path: '/register',                           label: 'Register (noindex)',                  category: 'F' },
  { path: '/bulk-order/enquiry',                 label: 'Bulk Enquiry Form (noindex)',         category: 'F' },
  { path: '/api/',                               label: 'API namespace (blocked)',              category: 'H' },
  { path: '/admin',                              label: 'Admin (blocked)',                     category: 'H' },
];

const CATEGORY_LABELS = {
  A: 'Indexed — Homepage',
  B: 'Indexed — Commercial',
  C: 'Indexed — Informational',
  D: 'Indexed — Utility',
  E: 'Indexed — Parameterised',
  F: 'Noindex — Private/Transactional',
  G: 'Noindex — Interactive',
  H: 'Blocked — robots.txt',
  I: 'Sitemap Only',
  J: 'Worker Only',
  K: 'Unknown',
};

// ── 3. Build inventory ────────────────────────────────────────────────────────
const rows = [];
const seenUrls = new Set();

for (const route of APP_ROUTES) {
  const fullUrl = `${ORIGIN}${route.path}`;
  const inSitemap = sitemapUrls.has(fullUrl);
  const indexable = !['F', 'G', 'H'].includes(route.category);
  const action = indexable
    ? (inSitemap ? 'None — already indexed' : 'Add to sitemap if indexable')
    : 'Verify noindex header is served';

  rows.push({
    url: fullUrl,
    path: route.path,
    label: route.label,
    category: route.category,
    categoryLabel: CATEGORY_LABELS[route.category],
    inSitemap: inSitemap ? 'YES' : 'NO',
    inWorker: 'YES',
    indexable: indexable ? 'YES' : 'NO',
    action,
  });
  seenUrls.add(fullUrl);
}

// Check sitemap URLs not in APP_ROUTES (category I)
for (const url of sitemapUrls) {
  if (!seenUrls.has(url)) {
    const urlPath = url.replace(ORIGIN, '');
    rows.push({
      url,
      path: urlPath,
      label: 'Sitemap only — not in worker routes',
      category: 'I',
      categoryLabel: CATEGORY_LABELS['I'],
      inSitemap: 'YES',
      inWorker: 'NO',
      indexable: 'UNKNOWN',
      action: 'Verify worker handles this URL',
    });
  }
}

// ── 4. Write CSV ──────────────────────────────────────────────────────────────
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const csvHeader = 'Category,Category Label,URL,Path,Label,In Sitemap,In Worker,Indexable,Recommended Action\n';
const csvRows = rows.map(r =>
  [r.category, r.categoryLabel, r.url, r.path, `"${r.label}"`, r.inSitemap, r.inWorker, r.indexable, `"${r.action}"`].join(',')
).join('\n');

const csvPath = path.join(REPORT_DIR, 'url-indexing-inventory.csv');
fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
console.log(`✅  URL Inventory saved → ${csvPath}`);

// ── 5. Print summary ──────────────────────────────────────────────────────────
const byCategory = {};
for (const r of rows) {
  byCategory[r.category] = (byCategory[r.category] || 0) + 1;
}

console.log('\n📋  URL INDEXING INVENTORY SUMMARY\n');
console.log(`${'Category'.padEnd(5)} ${'Label'.padEnd(40)} Count`);
console.log('─'.repeat(55));
for (const [cat, count] of Object.entries(byCategory).sort()) {
  console.log(`  ${cat}    ${CATEGORY_LABELS[cat].padEnd(38)} ${count}`);
}
console.log(`\n  Total URLs: ${rows.length}`);
console.log(`  Sitemap URLs: ${sitemapUrls.size}`);
console.log(`  Indexable app routes: ${rows.filter(r => r.indexable === 'YES').length}`);
console.log(`  Noindex/Blocked routes: ${rows.filter(r => r.indexable === 'NO').length}`);

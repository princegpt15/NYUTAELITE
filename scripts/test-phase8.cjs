/**
 * Phase 8 Verification Script
 * Checks: robots.txt, sitemap.xml integrity, _worker.js header logic
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const ROBOTS   = path.join(ROOT, 'public', 'robots.txt');
const SITEMAP  = path.join(ROOT, 'public', 'sitemap.xml');
const WORKER   = path.join(ROOT, 'public', '_worker.js');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}: PASS`);
    passed++;
  } else {
    console.error(`  ✗ ${label}: FAIL${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ── robots.txt checks ────────────────────────────────────────────────────────
console.log('\n1. robots.txt checks:');
const robots = fs.readFileSync(ROBOTS, 'utf8');
assert('User-agent wildcard present',   robots.includes('User-agent: *'));
assert('Allow / present',               robots.includes('Allow: /\n') || robots.includes('Allow: /\r'));
assert('Allow /learn/ present',         robots.includes('Allow: /learn/'));
assert('Allow /products/ present',      robots.includes('Allow: /products/'));
assert('Allow /categories present',     robots.includes('Allow: /categories'));
assert('Disallow /admin/ present',      robots.includes('Disallow: /admin/'));
assert('Disallow /cart present',        robots.includes('Disallow: /cart'));
assert('Disallow /checkout present',    robots.includes('Disallow: /checkout'));
assert('Disallow /orders present',      robots.includes('Disallow: /orders'));
assert('Disallow /account present',     robots.includes('Disallow: /account'));
assert('Disallow /wishlist present',    robots.includes('Disallow: /wishlist'));
assert('Disallow /login present',       robots.includes('Disallow: /login'));
assert('Disallow /register present',    robots.includes('Disallow: /register'));
assert('Disallow /api/ present',        robots.includes('Disallow: /api/'));
assert('Disallow /bulk-order/enquiry present', robots.includes('Disallow: /bulk-order/enquiry'));
assert('Sitemap declared',              robots.includes('Sitemap: https://nyutaelite.com/sitemap.xml'));

// ── sitemap.xml checks ───────────────────────────────────────────────────────
console.log('\n2. sitemap.xml checks:');
const sitemap = fs.readFileSync(SITEMAP, 'utf8');
assert('XML declaration present',         sitemap.startsWith('<?xml'));
assert('Sitemap namespace present',        sitemap.includes('http://www.sitemaps.org/schemas/sitemap/0.9'));
assert('Image namespace present',          sitemap.includes('http://www.google.com/schemas/sitemap-image/1.1'));
assert('Homepage URL present',             sitemap.includes('<loc>https://nyutaelite.com/</loc>'));
assert('Homepage priority 1.0',            sitemap.match(/<loc>https:\/\/nyutaelite\.com\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/));
assert('categories URL present',           sitemap.includes('<loc>https://nyutaelite.com/categories</loc>'));
assert('categories?type=Premium present',  sitemap.includes('categories?type=Premium'));
assert('categories?type=Normal present',   sitemap.includes('categories?type=Normal'));
assert('/products/makhana present',        sitemap.includes('<loc>https://nyutaelite.com/products/makhana</loc>'));
['premium-100g','premium-200g','premium-250g','normal-100g','normal-200g','normal-250g'].forEach(sku => {
  assert(`SKU ${sku} in sitemap`, sitemap.includes(`sku=${sku}`));
});
assert('/about URL present',              sitemap.includes('<loc>https://nyutaelite.com/about</loc>'));
assert('/faq URL present',               sitemap.includes('<loc>https://nyutaelite.com/faq</loc>'));
assert('/contact URL present',           sitemap.includes('<loc>https://nyutaelite.com/contact</loc>'));
assert('/bulk-order/qualities present',  sitemap.includes('<loc>https://nyutaelite.com/bulk-order/qualities</loc>'));
assert('/learn/how-to-choose present',   sitemap.includes('/learn/how-to-choose-good-quality-makhana'));
assert('/learn/makhana-benefits present',sitemap.includes('/learn/makhana-benefits-health'));
assert('No http:// URLs (all HTTPS)',    !sitemap.match(/<loc>http:\/\//));
assert('No priority > 1.0',             !sitemap.match(/<priority>[2-9]/));
// Count <url> entries — expect exactly 17
const urlCount = (sitemap.match(/<url>/g) || []).length;
assert(`Exactly 17 URL entries (found ${urlCount})`, urlCount === 17);
// Confirm all lastmod dates updated to 2026-10-28
const oldLastmod = sitemap.match(/<lastmod>2026-10-25<\/lastmod>/g) || [];
assert(`No stale 2026-10-25 lastmod dates (found ${oldLastmod.length})`, oldLastmod.length === 0);

// ── _worker.js header logic checks ──────────────────────────────────────────
console.log('\n3. _worker.js header checks:');
const worker = fs.readFileSync(WORKER, 'utf8');
assert('addSecurityHeaders function defined',     worker.includes('function addSecurityHeaders'));
assert('isNoindexRoute function defined',          worker.includes('function isNoindexRoute'));
assert('NOINDEX_PREFIXES array defined',           worker.includes('NOINDEX_PREFIXES'));
assert('X-Content-Type-Options: nosniff set',     worker.includes("'X-Content-Type-Options', 'nosniff'"));
assert('X-Frame-Options: DENY set',               worker.includes("'X-Frame-Options', 'DENY'"));
assert('Referrer-Policy set',                      worker.includes('Referrer-Policy'));
assert('Permissions-Policy set',                   worker.includes('Permissions-Policy'));
assert('Cache-Control for HTML set',               worker.includes('s-maxage=60'));
assert('Cache-Control for assets (immutable)',     worker.includes('immutable'));
assert('X-Robots-Tag noindex for noindex routes', worker.includes("'X-Robots-Tag', 'noindex, nofollow'"));
assert('Link canonical header set',               worker.includes('rel="canonical"'));
assert('addSecurityHeaders called on injection',  (worker.match(/addSecurityHeaders/g) || []).length >= 3);
assert('/admin in NOINDEX_PREFIXES',              worker.includes("'/admin'"));
assert('/cart in NOINDEX_PREFIXES',               worker.includes("'/cart'"));
assert('/checkout in NOINDEX_PREFIXES',           worker.includes("'/checkout'"));

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(60)}`);
console.log(` PHASE 8 TEST SUMMARY: ${passed} passed, ${failed} failed.`);
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);

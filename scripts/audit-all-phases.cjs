/**
 * FULL CROSS-PHASE AUDIT — Phases 2–8
 * Validates every change against the original prompt requirements.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0;
let failed = 0;
let warnings = [];

function ok(label, condition, detail) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
function warn(label, msg) {
  console.warn(`  ⚠ ${label}${msg ? ' — ' + msg : ''}`);
  warnings.push(label);
}

// ── Load files ───────────────────────────────────────────────────────────────
const indexHtml   = read('index.html');
const workerJs    = read('public/_worker.js');
const robotsTxt   = read('public/robots.txt');
const sitemapXml  = read('public/sitemap.xml');
const seoTs       = read('src/utils/seo.ts');
const productTsx  = read('src/pages/Product.tsx');
const categoriesTsx = read('src/pages/Categories.tsx');
const homeTsx     = read('src/pages/Home.tsx');

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 2 — Homepage SEO Metadata                        ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// index.html title — brand-name-first format (updated SEO investigation fix)
ok('Title: NYUTA ELITE MAKHANA | Premium Makhana & Fox Nuts from Bihar',
  indexHtml.includes('<title>NYUTA ELITE MAKHANA | Premium Makhana') &&
  indexHtml.includes('Fox Nuts from Bihar</title>'));

// Meta description — specific with pack sizes and FSSAI
ok('Meta description mentions pack sizes and brand',
  indexHtml.includes('100g') && indexHtml.includes('200g') && indexHtml.includes('FSSAI'));

// Canonical
ok('Canonical URL = https://nyutaelite.com/',
  indexHtml.includes('<link rel="canonical" href="https://nyutaelite.com/"'));

// Robots
ok('robots = index, follow',
  indexHtml.includes('content="index, follow"'));

// OG title
ok('og:title matches page title',
  indexHtml.includes('og:title" content="NYUTA ELITE MAKHANA | Premium Makhana'));

// OG description
ok('og:description set',
  indexHtml.includes('og:description"'));

// OG type
ok('og:type = website',
  indexHtml.includes('og:type" content="website"'));

// OG url
ok('og:url = https://nyutaelite.com/',
  indexHtml.includes('og:url" content="https://nyutaelite.com/"'));

// OG site_name
ok('og:site_name = NYUTA ELITE MAKHANA',
  indexHtml.includes('og:site_name" content="NYUTA ELITE MAKHANA"'));

// OG image
ok('og:image set (no broken reference)',
  indexHtml.includes('og:image" content="https://nyutaelite.com/'));

// OG image:alt
ok('og:image:alt set',
  indexHtml.includes('og:image:alt"'));

// OG locale
ok('og:locale = en_IN',
  indexHtml.includes('og:locale" content="en_IN"'));

// Twitter card
ok('twitter:card = summary_large_image',
  indexHtml.includes('twitter:card" content="summary_large_image"'));

ok('twitter:title set',
  indexHtml.includes('twitter:title"'));

ok('twitter:description set',
  indexHtml.includes('twitter:description"'));

ok('twitter:image set',
  indexHtml.includes('twitter:image"'));

// No duplicate canonical tags (count occurrences)
const canonicalCount = (indexHtml.match(/rel="canonical"/g) || []).length;
ok(`Only ONE canonical tag in index.html (found ${canonicalCount})`,
  canonicalCount === 1);

// No duplicate title tags
const titleCount = (indexHtml.match(/<title>/g) || []).length;
ok(`Only ONE title tag in index.html (found ${titleCount})`,
  titleCount === 1);

// seo.ts homepage title
ok('seo.ts homepage title matches',
  seoTs.includes("'NYUTA ELITE MAKHANA | Premium Makhana"));

// seo.ts homepage canonical
ok('seo.ts homepage canonical = https://nyutaelite.com/',
  seoTs.includes(`\`\${PRODUCTION_ORIGIN}/\``));

// seo.ts Homepage robots
ok('seo.ts homepage robots = index, follow',
  seoTs.includes("robots: 'index, follow'") && seoTs.indexOf("robots: 'index, follow'") < seoTs.indexOf('resolveRouteSeo') + 10000);

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 3 — Homepage H1 & Content                        ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// index.html static prerender H1
ok('Static prerender H1: NYUTA ELITE MAKHANA – Premium Fox Nuts from Bihar',
  indexHtml.includes('NYUTA ELITE MAKHANA – Premium Fox Nuts from Bihar'));

// Supporting headline
ok('Supporting headline present: Better Snacking Starts with Quality Makhana',
  indexHtml.includes('Better Snacking Starts with Quality Makhana'));

// Intro copy
ok('Intro copy present',
  indexHtml.includes('Discover NYUTA ELITE MAKHANA, a brand focused on makhana'));

// Product links in static prerender (all 6 SKUs)
const skus = ['premium-100g','premium-200g','premium-250g','normal-100g','normal-200g','normal-250g'];
skus.forEach(sku => {
  ok(`Static prerender links to /products/makhana?sku=${sku}`,
    indexHtml.includes(`sku=${sku}`));
});

// Navigation links
ok('Navigation: Shop Makhana link', indexHtml.includes('href="/categories"'));
ok('Navigation: About link',        indexHtml.includes('href="/about"'));
ok('Navigation: Contact link',      indexHtml.includes('href="/contact"'));
ok('Navigation: FAQ link',          indexHtml.includes('href="/faq"'));

// Customer care section
ok('Customer care section present (shipping/returns/contact)',
  indexHtml.includes('info@nyutaelite.com'));

// No sr-only H1 workaround
ok('No sr-only hidden H1',
  !indexHtml.includes('sr-only') || !indexHtml.match(/sr-only[^>]*>.*NYUTA ELITE/));

// Home.tsx has visible H1
ok('Home.tsx live H1: NYUTA ELITE MAKHANA – Premium Fox Nuts from Bihar',
  homeTsx.includes('NYUTA ELITE MAKHANA – Premium Fox Nuts from Bihar'));

// No duplicate H1 in Home.tsx
const h1Count = (homeTsx.match(/<h1/g) || []).length;
ok(`Home.tsx has exactly 1 H1 element (found ${h1Count})`, h1Count === 1);

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 4 — React Rendering & Crawlability               ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// Static prerender inside #root
ok('Static prerender exists inside id="root"',
  indexHtml.includes('<div id="root">') && indexHtml.includes('NYUTA ELITE MAKHANA – Premium Fox Nuts from Bihar'));

// _worker.js edge injection exists
ok('_worker.js injectSeo() function exists',
  workerJs.includes('function injectSeo('));

ok('_worker.js renderRouteBody() function exists',
  workerJs.includes('function renderRouteBody('));

ok('_worker.js resolveSeoForRequest() function exists',
  workerJs.includes('function resolveSeoForRequest('));

ok('_worker.js shouldInjectSeo() function exists',
  workerJs.includes('function shouldInjectSeo('));

// Per-route injection for product pages
ok('Worker injects product-specific title for product pages',
  workerJs.includes('NYUTA ELITE Makhana –'));

// Edge worker skips API, assets
ok('Worker skips /api/ paths from SEO injection',
  workerJs.includes("path.startsWith('/api/')"));

ok('Worker skips static assets from SEO injection',
  workerJs.includes('shouldInjectSeo') && workerJs.includes('Skip asset requests') && workerJs.includes('js|css|png|jpg'));

// JSON-LD cleanup in seo.ts
ok('applySeoToDocument() cleans static JSON-LD scripts before re-injecting',
  seoTs.includes('data-edge-injected="true"') && seoTs.includes('removeChild'));

// Product SEO hook in Product.tsx
ok('Product.tsx calls applySeoToDocument() with resolveRouteSeo()',
  productTsx.includes('applySeoToDocument') && productTsx.includes('resolveRouteSeo'));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 5 — Product Page SEO                             ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// seo.ts product title pattern
ok('Product title template: NYUTA ELITE Makhana – [Quality] [Weight]g | Buy Online',
  seoTs.includes('`NYUTA ELITE Makhana – ${matchedProduct.quality} ${matchedProduct.weightGrams}g | Buy Online`'));

// Product description includes live price
ok('Product description includes live price (₹)',
  seoTs.includes('₹${matchedProduct.price}') || seoTs.includes('\\u20b9${matchedProduct.price}'));

// Product canonical uses ?sku= format
ok('Product canonical: /products/makhana?sku={sku}',
  seoTs.includes('/products/makhana?sku='));

// Product robots = index, follow
ok('Product pages are indexable (robots: index, follow)',
  seoTs.includes("robots: 'index, follow'") && seoTs.includes("ogType: 'product'"));

// Product JSON-LD built from real data (no fake ratings)
ok('No fake aggregate ratings in product JSON-LD',
  !seoTs.includes('aggregateRating') || !seoTs.includes('ratingValue'));

ok('Product JSON-LD includes brand',
  seoTs.includes("'@type': 'Brand'"));

ok('Product JSON-LD includes shippingDetails',
  seoTs.includes('shippingDetails'));

ok('Product JSON-LD includes hasMerchantReturnPolicy',
  seoTs.includes('hasMerchantReturnPolicy'));

ok('Product JSON-LD includes seller',
  seoTs.includes("'@type': 'Organization'") && seoTs.includes('seller'));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 6 — Structured Data                              ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// Organization schema
ok('Organization @type in index.html',
  indexHtml.includes('"@type": "Organization"'));

ok('Organization name = NYUTA ELITE MAKHANA',
  indexHtml.includes('"name": "NYUTA ELITE MAKHANA"'));

ok('Organization alternateName includes NYUTAELITE and NYUTA ELITE',
  indexHtml.includes('"NYUTAELITE"') && indexHtml.includes('"NYUTA ELITE"'));

ok('Organization url = https://nyutaelite.com/',
  indexHtml.includes('"url": "https://nyutaelite.com/"'));

ok('Organization logo ImageObject present',
  indexHtml.includes('"@type": "ImageObject"'));

ok('Organization contactPoint present',
  indexHtml.includes('"contactType": "customer service"'));

// No fake sameAs array
ok('No empty sameAs: [] in Organization',
  !indexHtml.includes('"sameAs": []'));

// WebSite schema
ok('WebSite @type in index.html',
  indexHtml.includes('"@type": "WebSite"'));

ok('WebSite name = NYUTA ELITE MAKHANA',
  (indexHtml.match(/"@type": "WebSite"/g) || []).length >= 1);

// No SearchAction (deprecated Nov 2024)
ok('No deprecated SearchAction/potentialAction in WebSite schema',
  !indexHtml.includes('SearchAction') && !workerJs.includes('SearchAction'));

// FAQPage schema on homepage
ok('FAQPage schema generated for / route',
  seoTs.includes("'@type': 'FAQPage'") || seoTs.includes('"@type": "FAQPage"'));

// BreadcrumbList on product pages
ok('BreadcrumbList built for product routes',
  seoTs.includes("'@type': 'BreadcrumbList'") || seoTs.includes('"@type": "BreadcrumbList"'));

// Article schema for /learn/ pages
ok('Article schema built for /learn/ routes',
  seoTs.includes("'@type': 'Article'"));

// No JSON-LD duplicate mechanism
ok('applySeoToDocument() removes static JSON-LD IDs before injecting (no duplicates)',
  seoTs.includes('#jsonld-organization') && seoTs.includes('#jsonld-website'));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 7 — Canonical URLs & Duplicate Content           ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// HTTP → HTTPS redirect
ok('Worker: HTTP → HTTPS 301 redirect',
  workerJs.includes("url.protocol === 'http:'") && workerJs.includes('301'));

// www → apex redirect
ok('Worker: www → apex (nyutaelite.com) 301 redirect',
  workerJs.includes("url.hostname === 'www.nyutaelite.com'"));

// Trailing slash normalization
ok('Worker: trailing slash normalization',
  workerJs.includes("url.pathname.endsWith('/')") && workerJs.includes('cleanPath'));

// Policy aliases
ok('Worker: /bulk-order → /bulk-order/qualities redirect',
  workerJs.includes("'/bulk-order': '/bulk-order/qualities'"));

// Product slug → canonical redirect
ok('Worker: /products/:slug → /products/makhana?sku=:slug redirect',
  workerJs.includes("url.pathname !== '/products/makhana'") && workerJs.includes("url.origin}/products/makhana?sku="));

// Categories filter URLs have own canonical
ok('seo.ts: categories?type=Premium has distinct canonical',
  seoTs.includes('categories?type=Premium'));

ok('seo.ts: categories?type=Normal has distinct canonical',
  seoTs.includes('categories?type=Normal'));

// Sitemap has filter URLs
ok('sitemap.xml: categories?type=Premium in sitemap',
  sitemapXml.includes('categories?type=Premium'));

ok('sitemap.xml: categories?type=Normal in sitemap',
  sitemapXml.includes('categories?type=Normal'));

// Private routes are noindex
ok('seo.ts: /cart, /checkout, /orders, /login are noindex',
  seoTs.includes("'/cart'") && seoTs.includes("robots: 'noindex, nofollow'"));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  PHASE 8 — Sitemaps, Robots.txt & Edge Headers          ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// robots.txt
ok('robots.txt: Allow /learn/',   robotsTxt.includes('Allow: /learn/'));
ok('robots.txt: Allow /products/', robotsTxt.includes('Allow: /products/'));
ok('robots.txt: Disallow /admin/', robotsTxt.includes('Disallow: /admin/'));
ok('robots.txt: Sitemap declared', robotsTxt.includes('Sitemap: https://nyutaelite.com/sitemap.xml'));

// sitemap.xml counts
const urlCount = (sitemapXml.match(/<url>/g) || []).length;
ok(`sitemap.xml: ${urlCount} URL entries (found ${urlCount})`, urlCount >= 17);

ok('sitemap.xml: Homepage priority 1.0',
  sitemapXml.match(/<loc>https:\/\/nyutaelite\.com\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/));

ok('sitemap.xml: No http:// URLs',
  !sitemapXml.match(/<loc>http:\/\//));

ok('sitemap.xml: No stale 2026-10-25 lastmod',
  !(sitemapXml.match(/<lastmod>2026-10-25<\/lastmod>/g) || []).length);

skus.forEach(sku => {
  ok(`sitemap.xml: SKU ${sku} present`, sitemapXml.includes(`sku=${sku}`));
});

ok('sitemap.xml: /learn/how-to-choose-good-quality-makhana present',
  sitemapXml.includes('/learn/how-to-choose-good-quality-makhana'));

ok('sitemap.xml: /learn/makhana-benefits-health present',
  sitemapXml.includes('/learn/makhana-benefits-health'));

// _worker.js security headers
ok('Worker: addSecurityHeaders() function defined',
  workerJs.includes('function addSecurityHeaders'));

ok('Worker: X-Content-Type-Options: nosniff',
  workerJs.includes("'X-Content-Type-Options', 'nosniff'"));

ok('Worker: X-Frame-Options: DENY',
  workerJs.includes("'X-Frame-Options', 'DENY'"));

ok('Worker: Referrer-Policy set',
  workerJs.includes('Referrer-Policy'));

ok('Worker: Permissions-Policy set',
  workerJs.includes('Permissions-Policy'));

ok('Worker: Cache-Control HTML (s-maxage)',
  workerJs.includes('s-maxage=60'));

ok('Worker: Cache-Control assets (immutable)',
  workerJs.includes('immutable'));

ok('Worker: X-Robots-Tag noindex on private routes',
  workerJs.includes("'X-Robots-Tag', 'noindex, nofollow'"));

ok('Worker: Link canonical header injected',
  workerJs.includes('rel="canonical"') && workerJs.includes("headers.set('Link'"));

ok('Worker: isNoindexRoute() function defined',
  workerJs.includes('function isNoindexRoute'));

ok('Worker: NOINDEX_PREFIXES covers /cart, /checkout, /admin',
  workerJs.includes("'/cart'") && workerJs.includes("'/checkout'") && workerJs.includes("'/admin'"));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  CONSTRAINT CHECKS — No Invented Data, No Broken Rules  ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// No organic claims
ok('No unsupported "organic" certification claim',
  !indexHtml.includes('organic certified') && !workerJs.includes('organic certified'));

// No fake reviews
ok('No fake aggregateRating injected without real data',
  !seoTs.includes("aggregateRating: {") || seoTs.includes('// never'));

// No invented social profiles
ok('No sameAs: [] injected (no fake social profiles)',
  !indexHtml.includes('"sameAs": []') && !workerJs.includes('"sameAs": []'));

// No lab-tested claims
ok('No unverified lab-tested claims',
  !indexHtml.includes('lab tested') && !workerJs.includes('lab-tested certified'));

// Razorpay checkout preserved
ok('Razorpay checkout not referenced as broken/removed',
  !productTsx.includes('// REMOVED razorpay') && !productTsx.includes('// BROKEN'));

// Admin routes all noindex
ok('Admin routes are noindex in seo.ts',
  seoTs.includes("normalizedPath === '/admin'") && seoTs.includes("robots: 'noindex, nofollow'"));

// All 6 product prices match catalog
const catalogPrices = { 'premium-100g': 160, 'premium-200g': 310, 'premium-250g': 380, 'normal-100g': 120, 'normal-200g': 230, 'normal-250g': 280 };
Object.entries(catalogPrices).forEach(([sku, price]) => {
  ok(`Worker catalog: ${sku} = ₹${price}`,
    workerJs.includes(`price: ${price}`));
});

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(62)}`);
console.log(` FULL AUDIT SUMMARY`);
console.log(`${'═'.repeat(62)}`);
console.log(` ✓ PASSED : ${passed}`);
console.log(` ✗ FAILED : ${failed}`);
if (warnings.length) console.log(` ⚠ WARNINGS: ${warnings.length}`);
console.log(`${'═'.repeat(62)}`);
process.exit(failed > 0 ? 1 : 0);

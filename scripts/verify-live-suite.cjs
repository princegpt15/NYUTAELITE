'use strict';
const https = require('https');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Googlebot/2.1', 'Accept': 'text/html,application/xhtml+xml', ...headers }, timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

function parseJsonLd(html) {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return matches.map(tag => {
    const raw = tag.replace(/<script[^>]*>|<\/script>/gi, '').trim();
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

const ROUTES_TO_AUDIT = [
  '/',
  '/categories',
  '/categories?type=Premium',
  '/categories?type=Normal',
  '/about',
  '/faq',
  '/contact',
  '/bulk-order/qualities',
  '/products/makhana?sku=premium-100g',
  '/products/makhana?sku=premium-200g',
  '/products/makhana?sku=premium-250g',
  '/products/makhana?sku=normal-100g',
  '/products/makhana?sku=normal-200g',
  '/products/makhana?sku=normal-250g',
  '/learn/how-to-choose-good-quality-makhana',
  '/learn/makhana-benefits-health',
  '/learn/how-to-store-makhana',
  '/learn/makhana-pack-size-guide',
  '/learn/ordering-makhana-online-india'
];

async function run() {
  console.log('========================================================');
  console.log(' FULL LIVE PRODUCTION ENDPOINT AUDIT (https://nyutaelite.com)');
  console.log('========================================================\n');

  let passed = 0;
  for (const path of ROUTES_TO_AUDIT) {
    const res = await fetch(`https://nyutaelite.com${path}`);
    const title = (res.body.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const canon = (res.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) || [])[1] || '';
    const schemas = parseJsonLd(res.body).map(s => s['@type']).join(', ');

    const ok = res.status === 200 && title && canon;
    if (ok) passed++;

    console.log(`${ok ? '✓' : '✗'} [${res.status}] ${path}`);
    console.log(`   Title:     ${title}`);
    console.log(`   Canonical: ${canon}`);
    console.log(`   Schemas:   ${schemas || 'None'}`);
    console.log('');
  }

  console.log('========================================================');
  console.log(` AUDIT SUMMARY: ${passed}/${ROUTES_TO_AUDIT.length} Passed`);
  console.log('========================================================');
}

run().catch(console.error);

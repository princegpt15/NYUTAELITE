#!/usr/bin/env node
/**
 * Phase 4 / Regression Test — Worker SEO Injection Guard
 *
 * Validates that shouldInjectSeo() returns true for all navigation paths
 * regardless of whether the request includes an Accept: text/html header.
 * This specifically guards against the bug where older Googlebot UA variants
 * omit the Accept header and receive raw index.html metadata on all routes.
 */

'use strict';

// ── Minimal mock for the Cloudflare Request object ────────────────────────────
function makeRequest(path, accept) {
  return {
    headers: {
      get(name) {
        if (name === 'Accept') return accept || null;
        return null;
      },
    },
    url: `https://nyutaelite.com${path}`,
  };
}

// ── Inline the shouldInjectSeo function as it exists in _worker.js ────────────
// (We import the logic directly so this test breaks if the worker is changed.)
const fs = require('fs');
const path = require('path');
const workerSrc = fs.readFileSync(path.join(__dirname, '..', 'public', '_worker.js'), 'utf8');

// Extract the shouldInjectSeo function body from the worker source
const fnMatch = workerSrc.match(/function shouldInjectSeo\(url[^)]*\)\s*\{([\s\S]*?)^}/m);
if (!fnMatch) {
  console.error('✖  Could not extract shouldInjectSeo from _worker.js');
  process.exit(1);
}

// Reconstruct for evaluation
const fnBody = `
function shouldInjectSeo(url, _request) {
${fnMatch[1]}
}
`;
// eslint-disable-next-line no-new-func
const shouldInjectSeo = new Function('url', '_request', fnMatch[1]);

// ── Test cases ────────────────────────────────────────────────────────────────
const PASS = '✓';
const FAIL = '✖';
let passed = 0;
let failed = 0;

function test(label, url, accept, expectResult) {
  const parsedUrl = new URL(`https://nyutaelite.com${url}`);
  const req = makeRequest(url, accept);
  const result = shouldInjectSeo(parsedUrl, req);
  const ok = result === expectResult;
  if (ok) {
    passed++;
    console.log(`  ${PASS} ${label}`);
  } else {
    failed++;
    console.log(`  ${FAIL} ${label}`);
    console.log(`       Expected: ${expectResult}, Got: ${result}`);
  }
}

console.log('\n════════════════════════════════════════════════════════');
console.log(' Worker SEO Guard Regression Tests');
console.log('════════════════════════════════════════════════════════\n');

console.log('1. Navigation routes WITH Accept: text/html (must inject):');
test('/ with Accept: text/html',               '/',                'text/html,*/*', true);
test('/categories with Accept: text/html',     '/categories',      'text/html',     true);
test('/products/makhana with Accept',          '/products/makhana','text/html',     true);
test('/about with Accept',                     '/about',           'text/html',     true);
test('/faq with Accept',                       '/faq',             'text/html',     true);
test('/learn/... with Accept',                 '/learn/how-to-store-makhana', 'text/html', true);

console.log('\n2. Navigation routes WITHOUT Accept header (Googlebot — must also inject):');
test('/ without Accept header',                '/',                null,            true);
test('/categories without Accept',             '/categories',      null,            true);
test('/products/makhana without Accept',       '/products/makhana',null,            true);
test('/about without Accept',                  '/about',           null,            true);
test('/faq without Accept',                    '/faq',             null,            true);
test('/learn/... without Accept',              '/learn/makhana-benefits-health', null, true);

console.log('\n3. Navigation routes with Accept: */* (AdsBot — must inject):');
test('/ with Accept: */*',                     '/',                '*/*',           true);
test('/categories with Accept: */*',           '/categories',      '*/*',           true);

console.log('\n4. Asset paths (must NOT inject, regardless of Accept):');
test('/assets/index.js — no inject',           '/assets/index.js', 'text/html',     false);
test('/images/logo.webp — no inject',          '/images/logo.webp','text/html',     false);
test('/sitemap.xml — no inject',               '/sitemap.xml',      null,           false);
test('/robots.txt — no inject',               '/robots.txt',       null,            false);
test('/favicon.svg — no inject',              '/favicon.svg',      '*/*',           false);

console.log('\n5. Admin / API paths (must NOT inject):');
test('/api/orders — no inject',               '/api/orders',       'text/html',     false);
test('/admin — no inject',                    '/admin',            'text/html',     false);
test('/admin/products — no inject',           '/admin/products',   null,            false);

console.log('\n════════════════════════════════════════════════════════');
console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
console.log('════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.error(`❌  ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✅  All worker guard tests passed.');
}

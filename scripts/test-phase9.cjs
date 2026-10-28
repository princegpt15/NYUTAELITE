#!/usr/bin/env node
/**
 * Phase 9 — Internal Linking Verification Script
 * Checks that all internal link improvements are present in:
 *   - src/pages/Product.tsx
 *   - src/pages/Categories.tsx
 *   - src/pages/learn/HowToChooseMakhana.tsx
 *   - src/pages/learn/MakhanaHealthBenefits.tsx
 *   - public/_worker.js (crawler-visible HTML in renderRouteBody)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

let passed = 0;
let failed = 0;

function check(label, result, hint = '') {
  if (result) {
    console.log(`  ✔ ${label}: PASS`);
    passed++;
  } else {
    console.log(`  ✘ ${label}: FAIL${hint ? ' — ' + hint : ''}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Product.tsx internal links
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n1. Product.tsx — links to /learn/ articles and /faq');
const product = read('src/pages/Product.tsx');
check('Links to /learn/how-to-choose-good-quality-makhana', product.includes('/learn/how-to-choose-good-quality-makhana'));
check('Links to /learn/makhana-benefits-health', product.includes('/learn/makhana-benefits-health'));
check('Links to /faq', product.includes('/faq'));
check('Links to /bulk-order/qualities', product.includes('/bulk-order/qualities'));

// ─────────────────────────────────────────────────────────────────────────────
// 2. Categories.tsx internal links
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Categories.tsx — links to /learn/ articles');
const categories = read('src/pages/Categories.tsx');
check('Links to /learn/how-to-choose-good-quality-makhana', categories.includes('/learn/how-to-choose-good-quality-makhana'));
check('Links to /learn/makhana-benefits-health', categories.includes('/learn/makhana-benefits-health'));
check('Links to /faq', categories.includes('/faq'));
check('Links to /bulk-order/qualities', categories.includes('/bulk-order/qualities'));
check('Links to /about', categories.includes('/about'));

// ─────────────────────────────────────────────────────────────────────────────
// 3. HowToChooseMakhana.tsx cross-links + full pack size range
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. HowToChooseMakhana.tsx — cross-link to MakhanaHealthBenefits + full 6 SKUs');
const howTo = read('src/pages/learn/HowToChooseMakhana.tsx');
check('Cross-links to /learn/makhana-benefits-health', howTo.includes('/learn/makhana-benefits-health'));
check('Sidebar links to premium-100g', howTo.includes('premium-100g'));
check('Sidebar links to premium-200g', howTo.includes('premium-200g'));
check('Sidebar links to premium-250g', howTo.includes('premium-250g'));
check('Sidebar links to normal-100g', howTo.includes('normal-100g'));
check('Sidebar links to normal-200g', howTo.includes('normal-200g'));
check('Sidebar links to normal-250g', howTo.includes('normal-250g'));

// ─────────────────────────────────────────────────────────────────────────────
// 4. MakhanaHealthBenefits.tsx cross-links + full pack size range
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. MakhanaHealthBenefits.tsx — cross-link to HowToChoose + full 6 SKUs');
const health = read('src/pages/learn/MakhanaHealthBenefits.tsx');
check('Cross-links to /learn/how-to-choose-good-quality-makhana', health.includes('/learn/how-to-choose-good-quality-makhana'));
check('Sidebar links to premium-100g', health.includes('premium-100g'));
check('Sidebar links to premium-200g', health.includes('premium-200g'));
check('Sidebar links to premium-250g', health.includes('premium-250g'));
check('Sidebar links to normal-100g', health.includes('normal-100g'));
check('Sidebar links to normal-200g', health.includes('normal-200g'));
check('Sidebar links to normal-250g', health.includes('normal-250g'));

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract content from renderRouteBody for a given path
// ─────────────────────────────────────────────────────────────────────────────
const worker = read('public/_worker.js');
const renderBodyStart = worker.indexOf('function renderRouteBody');

function getRouteBodyBlock(routePath) {
  // Search from renderRouteBody onwards to find the path check
  let idx = renderBodyStart;
  let found = -1;
  const needle = `path === '${routePath}'`;
  while (true) {
    const ni = worker.indexOf(needle, idx + 1);
    if (ni === -1) break;
    found = ni;
    idx = ni;
  }
  if (found === -1) return '';
  return worker.slice(found, found + 8000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. _worker.js — categories page crawler HTML has /learn/ links
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. _worker.js — categories page renderRouteBody has /learn/ links');
const catBlock = getRouteBodyBlock('/categories');
check('Worker categories block found in renderRouteBody', catBlock.length > 0);
check('Worker categories: /learn/how-to-choose link', catBlock.includes('/learn/how-to-choose-good-quality-makhana'));
check('Worker categories: /learn/makhana-benefits-health link', catBlock.includes('/learn/makhana-benefits-health'));

// ─────────────────────────────────────────────────────────────────────────────
// 6. _worker.js — learn pages renderRouteBody has all 6 SKU links
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n6. _worker.js — learn pages renderRouteBody has all 6 SKU links');

const howToBlock = getRouteBodyBlock('/learn/how-to-choose-good-quality-makhana');
check('Worker HowToChoose block found', howToBlock.length > 0);
check('Worker HowToChoose: premium-100g link', howToBlock.includes('premium-100g'));
check('Worker HowToChoose: premium-200g link', howToBlock.includes('premium-200g'));
check('Worker HowToChoose: premium-250g link', howToBlock.includes('premium-250g'));
check('Worker HowToChoose: normal-100g link', howToBlock.includes('normal-100g'));
check('Worker HowToChoose: normal-200g link', howToBlock.includes('normal-200g'));
check('Worker HowToChoose: normal-250g link', howToBlock.includes('normal-250g'));
check('Worker HowToChoose: cross-link to makhana-benefits-health', howToBlock.includes('/learn/makhana-benefits-health'));

const healthBlock = getRouteBodyBlock('/learn/makhana-benefits-health');
check('Worker HealthBenefits block found', healthBlock.length > 0);
check('Worker HealthBenefits: premium-100g link', healthBlock.includes('premium-100g'));
check('Worker HealthBenefits: premium-200g link', healthBlock.includes('premium-200g'));
check('Worker HealthBenefits: premium-250g link', healthBlock.includes('premium-250g'));
check('Worker HealthBenefits: normal-100g link', healthBlock.includes('normal-100g'));
check('Worker HealthBenefits: normal-200g link', healthBlock.includes('normal-200g'));
check('Worker HealthBenefits: normal-250g link', healthBlock.includes('normal-250g'));
check('Worker HealthBenefits: cross-link to how-to-choose', healthBlock.includes('/learn/how-to-choose-good-quality-makhana'));

// ─────────────────────────────────────────────────────────────────────────────
// 7. _worker.js — footer has /learn/ links
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n7. _worker.js — footerHtml has /learn/ links');
// footerHtml is defined inside renderRouteBody
const footerIdx = worker.indexOf('const footerHtml', renderBodyStart);
const footerBlock = footerIdx > 0 ? worker.slice(footerIdx, footerIdx + 1200) : '';
check('footerHtml defined in renderRouteBody', footerBlock.length > 0);
check('Footer: /learn/how-to-choose link', footerBlock.includes('/learn/how-to-choose-good-quality-makhana'));
check('Footer: /learn/makhana-benefits-health link', footerBlock.includes('/learn/makhana-benefits-health'));

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(' PHASE 9 VERIFICATION SUMMARY');
console.log('═'.repeat(60));
console.log(` ✔ PASSED : ${passed}`);
console.log(` ✘ FAILED : ${failed}`);
console.log('═'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);

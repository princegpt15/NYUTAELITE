/**
 * Phase 14 Part 4 — Fix Wishlist.tsx, cart.ts, products.ts, wishlist.ts
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  'src/pages/Wishlist.tsx',
  'src/services/cart.ts',
  'src/services/products.ts',
  'src/services/wishlist.ts',
];

for (const rel of FILES) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) { console.log(`  SKIP: ${rel}`); continue; }

  let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const before = src;

  // Import statement: product-main.png → .webp
  src = src.replace(/(from\s+['"][^'"]*?)product-main\.png(['"])/g, '$1product-main.webp$2');
  // String literals: '/assets/product-main.png'
  src = src.replace(/\/assets\/product-main\.png/g, '/assets/product-main.webp');

  if (src !== before) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.log(`  ✓  Updated: ${rel}`);
  } else {
    console.log(`  -  No change: ${rel}`);
  }
}

console.log('\nDone.\n');

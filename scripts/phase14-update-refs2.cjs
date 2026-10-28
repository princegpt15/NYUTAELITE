/**
 * Phase 14 Part 3 — Update remaining PNG refs: Header, Footer, About, products.ts
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  'src/components/Footer.tsx',
  'src/components/Header.tsx',
  'src/pages/About.tsx',
  'src/services/products.ts',
];

for (const rel of FILES) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) { console.log(`  SKIP: ${rel}`); continue; }

  let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const before = src;

  // Logo reference
  src = src.replace(/\/nyuta-elite-logo\.png/g, '/nyuta-elite-logo.webp');
  // Product image dynamic refs
  src = src.replace(/\/images\/products\/([\w${}-]+)\.png/g, '/images/products/$1.webp');
  src = src.replace(/g\.png`;/g, 'g.webp`;');
  src = src.replace(/g\.png`/g, 'g.webp`');

  if (src !== before) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.log(`  ✓  Updated: ${rel}`);
  } else {
    console.log(`  -  No change: ${rel}`);
  }
}

console.log('\nDone.\n');

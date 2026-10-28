/**
 * Phase 14 Part 2 — Update all remaining PNG references to WebP
 * Targets: src/data/product.ts, src/data/products.ts, src/components/*MakhanaSection.tsx
 * src/pages/Categories.tsx, src/pages/Home.tsx, src/utils/seo.ts
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Files that reference /images/products/*.png with string literals
const FILES = [
  'src/data/product.ts',
  'src/data/products.ts',
  'src/pages/Categories.tsx',
  'src/pages/Home.tsx',
  'src/utils/seo.ts',
  'src/components/NormalMakhanaSection.tsx',
  'src/components/PremiumMakhanaSection.tsx',
];

for (const rel of FILES) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) { console.log(`  SKIP (not found): ${rel}`); continue; }

  let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const before = src;

  // Replace /images/products/*.png with *.webp
  src = src.replace(/\/images\/products\/([\w-]+)\.png/g, '/images/products/$1.webp');

  // Also replace dynamic template strings like: `...${weightGrams}g.png`
  src = src.replace(/g\.png`/g, 'g.webp`');

  if (src !== before) {
    fs.writeFileSync(filePath, src, 'utf8');
    const count = (before.match(/\/images\/products\/[\w-]+\.png|g\.png`/g) || []).length;
    console.log(`  ✓  ${rel}: updated ${count} reference(s)`);
  } else {
    console.log(`  -  ${rel}: no changes needed`);
  }
}

console.log('\nDone.\n');

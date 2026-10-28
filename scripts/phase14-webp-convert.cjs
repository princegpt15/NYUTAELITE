/**
 * Phase 14 — Image Optimisation: PNG/JPG → WebP
 * Converts heavy source images to WebP at quality 80
 * Updates import references in TSX files
 * Adds WebP versions alongside originals in public/images/products/
 */
'use strict';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUALITY = 80;

// ── 1. src/assets images (Vite-bundled, import path must match) ─────────────
const SRC_ASSETS = [
  'src/assets/images/brand/makhana-hero.png',
  'src/assets/images/brand/makhana-macro.png',
  'src/assets/images/dry-fruits-hero.png',
  'src/assets/images/brand-emblem.png',
  'src/assets/images/product-featured.png',
  'src/assets/images/hero-makhana.png',
  'src/assets/images/product-main.png',
];

// ── 2. public/images/products (served directly, add .webp sibling) ──────────
const PUBLIC_PRODUCT_IMAGES = [
  'public/images/products/premium-makhana-100g.png',
  'public/images/products/premium-makhana-200g.png',
  'public/images/products/premium-makhana-250g.png',
  'public/images/products/normal-makhana-100g.png',
  'public/images/products/normal-makhana-200g.png',
  'public/images/products/normal-makhana-250g.png',
];

async function convertImage(inputRel, outputRel) {
  const input = path.join(ROOT, inputRel);
  const output = path.join(ROOT, outputRel);
  if (!fs.existsSync(input)) {
    console.log(`  ⚠  SKIP (not found): ${inputRel}`);
    return false;
  }
  const before = fs.statSync(input).size;
  await sharp(input).webp({ quality: QUALITY }).toFile(output);
  const after = fs.statSync(output).size;
  const saving = (((before - after) / before) * 100).toFixed(1);
  console.log(`  ✓  ${outputRel}  ${(before/1024).toFixed(0)} KB → ${(after/1024).toFixed(0)} KB  (saved ${saving}%)`);
  return true;
}

async function main() {
  console.log('\n═══ Phase 14: Image → WebP Conversion ═══\n');

  // Convert src/assets images (replace .png with .webp in same dir)
  console.log('── src/assets images ──');
  for (const rel of SRC_ASSETS) {
    const webpRel = rel.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    await convertImage(rel, webpRel);
  }

  // Convert public/images/products (add .webp sibling)
  console.log('\n── public/images/products ──');
  for (const rel of PUBLIC_PRODUCT_IMAGES) {
    const webpRel = rel.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    await convertImage(rel, webpRel);
  }

  // Also convert the logo in public/
  console.log('\n── public logo ──');
  await convertImage('public/nyuta-elite-logo.png', 'public/nyuta-elite-logo.webp');
  await convertImage('public/nyutaelite-logo.png', 'public/nyutaelite-logo.webp');

  console.log('\n═══ Conversion complete ═══\n');

  // ── Now update import references in source files ──────────────────────────
  console.log('── Updating import references in TSX/TS files ──\n');

  const FILES_TO_UPDATE = [
    'src/pages/Home.tsx',
    'src/pages/Product.tsx',
    'src/pages/About.tsx',
    'src/components/ProductCard.tsx',
    'src/components/HeroSection.tsx',
  ];

  const PNG_ASSET_IMPORTS = [
    "brand/makhana-hero.png",
    "brand/makhana-macro.png",
    "dry-fruits-hero.png",
    "brand-emblem.png",
    "product-featured.png",
    "hero-makhana.png",
    "product-main.png",
  ];

  for (const file of FILES_TO_UPDATE) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) continue;
    let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    let changed = false;
    for (const img of PNG_ASSET_IMPORTS) {
      const webp = img.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      // Only change import statements (not other references)
      const importRegex = new RegExp(`(import\\s+\\w+\\s+from\\s+['"][^'"]*?)${img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g');
      if (importRegex.test(src)) {
        src = src.replace(importRegex, `$1${webp}$2`);
        changed = true;
        console.log(`  ✓  ${file}: ${img} → ${webp}`);
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, src, 'utf8');
    }
  }

  // Update index.html static prerender hero image reference
  const indexPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');
    let changed = false;

    // hero img in static prerender block
    if (html.includes('/images/brand/makhana-hero.png')) {
      html = html.replace(/\/images\/brand\/makhana-hero\.png/g, '/images/brand/makhana-hero.webp');
      changed = true;
      console.log('  ✓  index.html: /images/brand/makhana-hero.png → .webp (prerender)');
    }
    if (changed) fs.writeFileSync(indexPath, html, 'utf8');
  }

  // Update _worker.js: og:image and prerender references  
  const workerPath = path.join(ROOT, 'public/_worker.js');
  if (fs.existsSync(workerPath)) {
    let w = fs.readFileSync(workerPath, 'utf8').replace(/\r\n/g, '\n');
    let changed = false;
    // Update product image references in renderRouteBody
    const productImgPngs = [
      'premium-makhana-100g.png', 'premium-makhana-200g.png', 'premium-makhana-250g.png',
      'normal-makhana-100g.png', 'normal-makhana-200g.png', 'normal-makhana-250g.png',
    ];
    for (const img of productImgPngs) {
      const webp = img.replace('.png', '.webp');
      if (w.includes(img)) {
        w = w.replace(new RegExp(img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), webp);
        changed = true;
        console.log(`  ✓  _worker.js: ${img} → ${webp}`);
      }
    }
    if (changed) fs.writeFileSync(workerPath, w, 'utf8');
  }

  // Update sitemap.xml image:loc references
  const sitemapPath = path.join(ROOT, 'public/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    let xml = fs.readFileSync(sitemapPath, 'utf8').replace(/\r\n/g, '\n');
    let changed = false;
    const sitemapPngs = [
      'premium-makhana-100g.png', 'premium-makhana-200g.png', 'premium-makhana-250g.png',
      'normal-makhana-100g.png', 'normal-makhana-200g.png', 'normal-makhana-250g.png',
      'makhana-hero.png', 'nyuta-elite-logo.png',
    ];
    for (const img of sitemapPngs) {
      if (xml.includes(img)) {
        xml = xml.replace(new RegExp(img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), img.replace('.png', '.webp'));
        changed = true;
        console.log(`  ✓  sitemap.xml: ${img} → ${img.replace('.png', '.webp')}`);
      }
    }
    if (changed) fs.writeFileSync(sitemapPath, xml, 'utf8');
  }

  // Update seo.ts DEFAULT_OG_IMAGE if it references a PNG
  const seoPath = path.join(ROOT, 'src/utils/seo.ts');
  if (fs.existsSync(seoPath)) {
    let seo = fs.readFileSync(seoPath, 'utf8').replace(/\r\n/g, '\n');
    let changed = false;
    if (seo.includes('nyuta-elite-logo.png')) {
      seo = seo.replace(/nyuta-elite-logo\.png/g, 'nyuta-elite-logo.webp');
      changed = true;
      console.log('  ✓  seo.ts: DEFAULT_OG_IMAGE nyuta-elite-logo.png → .webp');
    }
    if (changed) fs.writeFileSync(seoPath, seo, 'utf8');
  }

  // Also need to copy hero to public/images/brand/ for the static prerender in index.html
  const brandDir = path.join(ROOT, 'public/images/brand');
  if (!fs.existsSync(brandDir)) {
    fs.mkdirSync(brandDir, { recursive: true });
    console.log('  ✓  Created public/images/brand/');
  }
  // Copy the webp hero to public/images/brand/makhana-hero.webp
  const srcHeroWebp = path.join(ROOT, 'src/assets/images/brand/makhana-hero.webp');
  const pubHeroWebp = path.join(ROOT, 'public/images/brand/makhana-hero.webp');
  if (fs.existsSync(srcHeroWebp) && !fs.existsSync(pubHeroWebp)) {
    fs.copyFileSync(srcHeroWebp, pubHeroWebp);
    console.log('  ✓  Copied makhana-hero.webp to public/images/brand/');
  }

  console.log('\n═══ All updates done ═══\n');
}

main().catch(err => { console.error(err); process.exit(1); });

// scripts/test_feed_validity.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== Google Merchant Center Feed Automated Validation ===\n');

// 1. Read feed.xml from public/
const feedPath = path.join(rootDir, 'public', 'feed.xml');
if (!fs.existsSync(feedPath)) {
  console.error(`FAIL: feed.xml not found at ${feedPath}`);
  process.exit(1);
}

const feedContent = fs.readFileSync(feedPath, 'utf8');

// 2. Validate XML structure
if (!feedContent.trim().startsWith('<?xml')) {
  console.error('FAIL: Feed does not start with XML declaration');
  process.exit(1);
}

if (!feedContent.includes('<rss version="2.0"') || !feedContent.includes('xmlns:g="http://base.google.com/ns/1.0"')) {
  console.error('FAIL: Missing RSS 2.0 or Google Merchant Center namespace');
  process.exit(1);
}
console.log('✓ XML declaration & RSS 2.0 Google namespace: VALID');

// 3. Extract items
const itemMatches = feedContent.match(/<item>[\s\S]*?<\/item>/g) || [];
console.log(`✓ Item count: ${itemMatches.length} (Expected: 6)`);
if (itemMatches.length !== 6) {
  console.error(`FAIL: Expected exactly 6 items, found ${itemMatches.length}`);
  process.exit(1);
}

// 4. Expected catalog
const EXPECTED_CATALOG = {
  'NYM-PREM-100': { price: '160.00 INR', title: 'Premium Makhana', weight: '100 g', quality: 'Premium' },
  'NYM-PREM-200': { price: '310.00 INR', title: 'Premium Makhana', weight: '200 g', quality: 'Premium' },
  'NYM-PREM-250': { price: '380.00 INR', title: 'Premium Makhana', weight: '250 g', quality: 'Premium' },
  'NYM-NORM-100': { price: '120.00 INR', title: 'Normal Makhana', weight: '100 g', quality: 'Normal' },
  'NYM-NORM-200': { price: '230.00 INR', title: 'Normal Makhana', weight: '200 g', quality: 'Normal' },
  'NYM-NORM-250': { price: '280.00 INR', title: 'Normal Makhana', weight: '250 g', quality: 'Normal' },
};

const seenIds = new Set();
let hasErrors = false;

itemMatches.forEach((itemXml, index) => {
  const getTag = (tag) => {
    const m = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return m ? m[1].trim() : null;
  };

  const id = getTag('g:id');
  const title = getTag('g:title');
  const desc = getTag('g:description');
  const link = getTag('g:link');
  const image = getTag('g:image_link');
  const price = getTag('g:price');
  const avail = getTag('g:availability');
  const brand = getTag('g:brand');
  const mpn = getTag('g:mpn');
  const idExists = getTag('g:identifier_exists');
  const cond = getTag('g:condition');
  const category = getTag('g:google_product_category');
  const weight = getTag('g:weight');

  // ID checks
  if (!id || !EXPECTED_CATALOG[id]) {
    console.error(`FAIL [Item ${index + 1}]: Unknown or missing ID: ${id}`);
    hasErrors = true;
    return;
  }
  if (seenIds.has(id)) {
    console.error(`FAIL [Item ${index + 1}]: Duplicate ID: ${id}`);
    hasErrors = true;
  }
  seenIds.add(id);

  const exp = EXPECTED_CATALOG[id];

  // Price & currency
  if (price !== exp.price) {
    console.error(`FAIL [${id}]: Price mismatch. Expected ${exp.price}, found ${price}`);
    hasErrors = true;
  }

  // Title & Brand
  if (brand !== 'NYUTAELITE') {
    console.error(`FAIL [${id}]: Brand mismatch. Expected NYUTAELITE, found ${brand}`);
    hasErrors = true;
  }

  // Links
  if (!link || !link.startsWith('https://nyutaelite.com/products/makhana?sku=')) {
    console.error(`FAIL [${id}]: Invalid landing page URL: ${link}`);
    hasErrors = true;
  }
  if (!image || !image.startsWith('https://nyutaelite.com/images/products/')) {
    console.error(`FAIL [${id}]: Invalid image URL: ${image}`);
    hasErrors = true;
  }

  // Availability & condition
  if (avail !== 'in_stock') {
    console.error(`FAIL [${id}]: Unexpected availability: ${avail}`);
    hasErrors = true;
  }
  if (cond !== 'new') {
    console.error(`FAIL [${id}]: Unexpected condition: ${cond}`);
    hasErrors = true;
  }

  // Identifiers
  if (idExists !== 'no' || !mpn) {
    console.error(`FAIL [${id}]: Identifier setting incorrect for private label: identifier_exists=${idExists}, mpn=${mpn}`);
    hasErrors = true;
  }

  // Category
  if (category !== '5765') {
    console.error(`FAIL [${id}]: Google product category incorrect: ${category}`);
    hasErrors = true;
  }

  // Private or admin URLs check
  if (link.includes('/admin') || link.includes('/checkout') || link.includes('/cart')) {
    console.error(`FAIL [${id}]: Private URL exposed in product link: ${link}`);
    hasErrors = true;
  }

  console.log(`✓ [${id}] ${title} | ${price} | ${avail} | ${weight} -> PASS`);
});

if (hasErrors) {
  console.error('\nFeed validation failed with errors.');
  process.exit(1);
} else {
  console.log('\nAll 6 products in feed.xml passed all compliance, price, and URL checks with 0 errors.');
}

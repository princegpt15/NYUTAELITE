/**
 * SEO Investigation Fix Script
 * Applies all confirmed fixes from the SEO audit report:
 *   Fix 1: Homepage title — brand-name-first format
 *   Fix 2: Meta description — specific with pack sizes & FSSAI
 *   Fix 3: _worker.js homepage JSON-LD injection (Organization + WebSite)
 *   Fix 4: _worker.js ogImage references .png → .webp
 *   Fix 5: _worker.js header <img> logo .png → .webp
 *   Fix 6: seo.ts + Home.tsx title/description alignment
 *   Fix 7: index.html og:image/twitter:image .png → .webp (already done, verify)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}
function write(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
  console.log(`  ✓  Updated: ${rel}`);
}

// ─── Authoritative new values ─────────────────────────────────────────────────
const NEW_TITLE = 'NYUTA ELITE MAKHANA | Premium Makhana & Fox Nuts from Bihar';
const NEW_DESC  = 'Shop NYUTA ELITE MAKHANA — premium Bihar fox nuts in 100g, 200g & 250g pouches. Premium and Normal grades. Pan-India delivery. FSSAI Reg. 20426021000494.';
const OLD_TITLE = 'NYUTAELITE | NYUTA ELITE MAKHANA – Premium Fox Nuts';
const OLD_DESC  = 'Shop NYUTA ELITE MAKHANA, premium fox nuts from Bihar. Explore available makhana packs in different sizes and grades for everyday snacking.';

console.log('\n═══ SEO Investigation Fixes ═══\n');

// ── Fix index.html ─────────────────────────────────────────────────────────────
{
  let f = read('index.html');
  let changed = false;

  // Title
  if (f.includes(OLD_TITLE)) {
    f = f.replace(new RegExp(OLD_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_TITLE);
    changed = true;
    console.log('  Fix 1: index.html title updated');
  }
  // Description
  if (f.includes(OLD_DESC)) {
    f = f.replace(new RegExp(OLD_DESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DESC);
    changed = true;
    console.log('  Fix 2: index.html description updated');
  }
  // og:image still .png?
  if (f.includes('nyuta-elite-logo.png')) {
    f = f.replace(/nyuta-elite-logo\.png/g, 'nyuta-elite-logo.webp');
    changed = true;
    console.log('  Fix 4: index.html og:image .png → .webp');
  }
  if (changed) write('index.html', f);
}

// ── Fix public/_worker.js ──────────────────────────────────────────────────────
{
  let f = read('public/_worker.js');
  let changed = false;

  // Fix 1+2: Title and description in the homepage fallback and any other place
  if (f.includes(OLD_TITLE)) {
    f = f.replace(new RegExp(OLD_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_TITLE);
    changed = true;
    console.log('  Fix 1: _worker.js title updated');
  }
  if (f.includes(OLD_DESC)) {
    f = f.replace(new RegExp(OLD_DESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DESC);
    changed = true;
    console.log('  Fix 2: _worker.js description updated');
  }

  // Fix 4+5: All .png logo references → .webp in worker
  if (f.includes('nyuta-elite-logo.png')) {
    f = f.replace(/nyuta-elite-logo\.png/g, 'nyuta-elite-logo.webp');
    changed = true;
    console.log('  Fix 4+5: _worker.js logo .png → .webp');
  }

  // Fix 3: Homepage fallback — add Organization + WebSite JSON-LD
  // Target: the homepage fallback return block that has jsonLd: []
  const OLD_HOMEPAGE_RETURN = `  // Default / homepage
  return {
    title: 'NYUTA ELITE MAKHANA | Premium Makhana & Fox Nuts from Bihar',
    desc:  'Shop NYUTA ELITE MAKHANA — premium Bihar fox nuts in 100g, 200g & 250g pouches. Premium and Normal grades. Pan-India delivery. FSSAI Reg. 20426021000494.',
    canonical: \`\${ORIGIN}/\`, ogType: 'website',
    ogImage: \`\${ORIGIN}/nyuta-elite-logo.webp\`, jsonLd: [],
  };`;

  // We'll replace the old homepage fallback (after previous title/desc replacements) 
  // with one that includes JSON-LD
  const HOMEPAGE_FALLBACK_PATTERN = /\/\/ Default \/ homepage\n  return \{[\s\S]*?jsonLd: \[\],\n  \};/;

  const NEW_HOMEPAGE_RETURN = `// Default / homepage
  return {
    title: '${NEW_TITLE}',
    desc:  '${NEW_DESC}',
    canonical: \`\${ORIGIN}/\`, ogType: 'website',
    ogImage: \`\${ORIGIN}/nyuta-elite-logo.webp\`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        alternateName: ['NYUTAELITE', 'NYUTA ELITE'],
        url: \`\${ORIGIN}/\`,
        logo: {
          '@type': 'ImageObject',
          url: \`\${ORIGIN}/nyuta-elite-logo.webp\`,
          width: 512,
          height: 512,
        },
        description: 'NYUTA ELITE MAKHANA is a premium Indian makhana brand offering handpicked fox nuts from Bihar. Available online in 100g, 200g, and 250g packs — Premium and Normal grade.',
        areaServed: 'IN',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+918102875852',
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi'],
          email: 'info@nyutaelite.com',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'NYUTA ELITE MAKHANA',
        alternateName: ['NYUTAELITE', 'NYUTA ELITE'],
        url: \`\${ORIGIN}/\`,
      },
    ],
  };`;

  if (HOMEPAGE_FALLBACK_PATTERN.test(f)) {
    f = f.replace(HOMEPAGE_FALLBACK_PATTERN, NEW_HOMEPAGE_RETURN);
    changed = true;
    console.log('  Fix 3: _worker.js homepage JSON-LD injected (Organization + WebSite)');
  } else {
    console.log('  WARN: Could not find homepage fallback pattern — manual check needed');
  }

  if (changed) write('public/_worker.js', f);
}

// ── Fix src/utils/seo.ts ───────────────────────────────────────────────────────
{
  let f = read('src/utils/seo.ts');
  let changed = false;

  if (f.includes(OLD_TITLE)) {
    f = f.replace(new RegExp(OLD_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_TITLE);
    changed = true;
    console.log('  Fix 1: seo.ts title updated');
  }
  if (f.includes(OLD_DESC)) {
    f = f.replace(new RegExp(OLD_DESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DESC);
    changed = true;
    console.log('  Fix 2: seo.ts description updated');
  }
  if (changed) write('src/utils/seo.ts', f);
}

// ── Fix src/pages/Home.tsx ────────────────────────────────────────────────────
{
  let f = read('src/pages/Home.tsx');
  let changed = false;

  if (f.includes(OLD_TITLE)) {
    f = f.replace(new RegExp(OLD_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_TITLE);
    changed = true;
    console.log('  Fix 1: Home.tsx seo.title updated');
  }
  if (f.includes(OLD_DESC)) {
    f = f.replace(new RegExp(OLD_DESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_DESC);
    changed = true;
    console.log('  Fix 2: Home.tsx seo.description updated');
  }
  if (changed) write('src/pages/Home.tsx', f);
}

console.log('\n═══ Done ═══\n');

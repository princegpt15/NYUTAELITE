'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', err => resolve({ status: 0, error: err.message }));
  });
}

async function verify() {
  console.log('====================================================');
  console.log('1. VERIFYING LOCAL REPOSITORY & BUILD ARTIFACTS');
  console.log('====================================================');

  // Check index.html
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const titleMatch = indexHtml.match(/<title>([^<]*)<\/title>/);
  console.log('Local index.html Title:       ', titleMatch ? titleMatch[1] : 'MISSING');

  const descMatch = indexHtml.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  console.log('Local index.html Description: ', descMatch ? descMatch[1] : 'MISSING');

  const canonMatch = indexHtml.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
  console.log('Local index.html Canonical:   ', canonMatch ? canonMatch[1] : 'MISSING');

  const h1Match = indexHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  console.log('Local index.html H1:          ', h1Match ? h1Match[1].trim().replace(/\s+/g, ' ') : 'MISSING');

  // Check WebP files
  const localWebpFiles = [
    'public/nyuta-elite-logo.webp',
    'public/images/products/premium-makhana-100g.webp',
    'public/images/products/premium-makhana-200g.webp',
    'public/images/products/premium-makhana-250g.webp',
    'public/images/products/normal-makhana-100g.webp',
    'public/images/products/normal-makhana-200g.webp',
    'public/images/products/normal-makhana-250g.webp',
    'public/images/brand/makhana-hero.webp',
    'src/assets/images/brand/makhana-hero.webp',
    'src/assets/images/brand/makhana-macro.webp',
    'src/assets/images/brand-emblem.webp',
  ];
  let missingFiles = 0;
  for (const rel of localWebpFiles) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      console.log('  ✗ Missing:', rel);
      missingFiles++;
    }
  }
  if (missingFiles === 0) {
    console.log('Local WebP Files:              All 11 essential WebP files exist on disk');
  }

  // Check dist build
  if (fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    const distHtml = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
    const distTitle = distHtml.match(/<title>([^<]*)<\/title>/);
    console.log('dist/index.html Title:        ', distTitle ? distTitle[1] : 'MISSING');
  } else {
    console.log('dist/index.html:               Not built yet or missing');
  }

  console.log('\n====================================================');
  console.log('2. VERIFYING CURRENT LIVE PRODUCTION (https://nyutaelite.com/)');
  console.log('====================================================');

  const home = await fetchUrl('https://nyutaelite.com/');
  if (home.error) {
    console.log('Live Homepage error:', home.error);
  } else {
    console.log('Live Homepage HTTP Status:    ', home.status);
    const liveTitle = home.body.match(/<title>([^<]*)<\/title>/);
    console.log('Live Homepage Title:          ', liveTitle ? liveTitle[1] : 'NONE');
    const liveDesc = home.body.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    console.log('Live Homepage Description:    ', liveDesc ? liveDesc[1] : 'NONE');
    const liveCanon = home.body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
    console.log('Live Homepage Canonical:      ', liveCanon ? liveCanon[1] : 'NONE');
    const liveH1 = home.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    console.log('Live Homepage H1:             ', liveH1 ? liveH1[1].trim().replace(/\s+/g, ' ') : 'NONE');
    
    // Check if live has JSON-LD (support any attribute order)
    const jsonLdMatches = home.body.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
    console.log('Live Homepage JSON-LD blocks: ', jsonLdMatches.length);
    jsonLdMatches.forEach((scriptTag, idx) => {
      const content = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '').trim();
      try {
        const parsed = JSON.parse(content);
        console.log(`  Block #${idx + 1} @type:          `, parsed['@type'], parsed.name ? `("${parsed.name}")` : '');
      } catch (e) {
        console.log(`  Block #${idx + 1} JSON parse error:`, e.message);
      }
    });
  }

  const logoRes = await fetchUrl('https://nyutaelite.com/nyuta-elite-logo.webp');
  console.log('Live WebP Logo Status:        ', logoRes.status);

  const robotsRes = await fetchUrl('https://nyutaelite.com/robots.txt');
  console.log('Live robots.txt Status:       ', robotsRes.status);

  const sitemapRes = await fetchUrl('https://nyutaelite.com/sitemap.xml');
  console.log('Live sitemap.xml Status:      ', sitemapRes.status);
}

verify().catch(console.error);

// scripts/deploy_and_verify.mjs
/**
 * NYUTAELITE Automated Production Deployment & Live Verification Pipeline
 * 
 * Executes:
 * 1. Pre-flight linting and TypeScript compilation
 * 2. Automated SEO Engine test suite
 * 3. Vite production build
 * 4. Cloudflare Pages direct upload deployment
 * 5. End-to-end live health and edge-rendered SEO verification
 */

import { execSync } from 'node:child_process';
import https from 'node:https';

const DOMAIN = 'https://nyutaelite.com';
const CHECK_URLS = [
  { path: '/', expectedText: 'NYUTA ELITE' },
  { path: '/sitemap.xml', expectedText: '<urlset' },
  { path: '/feed.xml', expectedText: '<rss' },
  { path: '/learn/how-to-choose-good-quality-makhana', expectedText: 'Good-Quality Makhana' },
  { path: '/learn/makhana-benefits-health', expectedText: 'Makhana Benefits: 7 Reasons' },
  { path: '/products/makhana', expectedText: 'Makhana' },
];

function runStep(name, command) {
  console.log(`\n========================================================`);
  console.log(` STEP: ${name}`);
  console.log(` COMMAND: ${command}`);
  console.log(`========================================================`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${name} succeeded.`);
  } catch (error) {
    console.error(`❌ ${name} FAILED.`);
    process.exit(1);
  }
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NyutaEliteDeployBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    ).on('error', reject);
  });
}

async function verifyLive() {
  console.log(`\n========================================================`);
  console.log(` STEP: Live Production Verification against ${DOMAIN}`);
  console.log(`========================================================`);

  let allPassed = true;

  for (const item of CHECK_URLS) {
    const fullUrl = `${DOMAIN}${item.path}`;
    try {
      const res = await fetchUrl(fullUrl);
      const hasText = res.body.includes(item.expectedText);
      const is200 = res.status === 200;

      if (is200 && hasText) {
        console.log(`  ✅ [${res.status}] ${item.path} (Matched "${item.expectedText}")`);
      } else {
        console.error(`  ❌ [${res.status}] ${item.path} (Missing "${item.expectedText}")`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`  ❌ Failed to reach ${item.path}: ${err.message}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error('\n❌ Production verification detected failures.');
    process.exit(1);
  }

  console.log('\n🎉 ALL LIVE VERIFICATION CHECKS PASSED!');
}

async function main() {
  console.log(`🚀 Starting NYUTAELITE Automated Deploy & Verification Pipeline...`);
  
  // 1. Run Tests & Validation
  runStep('Automated SEO Engine Unit Tests', 'npm run seo:test');
  
  // 2. TypeScript compilation & Build
  runStep('Production Build & Asset Compilation', 'npm run build');

  // 3. Deploy to Cloudflare Pages
  runStep('Cloudflare Pages Direct Upload', 'npx wrangler pages deploy dist --project-name=nyutaelite --branch=main');

  // 4. Live Verification
  await verifyLive();

  console.log('\n========================================================');
  console.log(' DEPLOYMENT PIPELINE FULLY COMPLETE & VERIFIED');
  console.log('========================================================\n');
}

main().catch((err) => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});

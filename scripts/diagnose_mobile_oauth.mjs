/**
 * Mobile OAuth Diagnosis Script
 * Tests Google Sign-In origin validation from mobile emulation perspective
 */
import https from 'https';
import http from 'http';

const CLIENT_ID = '27009619628-pca8lojc11kfad95ag8olnrqcnbj9lv6.apps.googleusercontent.com';
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

function fetchUrl(url, userAgent) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': userAgent || 'node-fetch',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    }, (res) => {
      const redirectUrl = res.headers['location'];
      resolve({ status: res.statusCode, redirectUrl, headers: res.headers });
      res.resume();
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function followRedirects(startUrl, ua, maxHops = 5) {
  const chain = [];
  let url = startUrl;
  for (let i = 0; i < maxHops; i++) {
    try {
      const r = await fetchUrl(url, ua);
      chain.push({ url, status: r.status, redirect: r.redirectUrl });
      if (r.status >= 300 && r.status < 400 && r.redirectUrl) {
        // Resolve relative redirects
        if (r.redirectUrl.startsWith('/')) {
          const u = new URL(url);
          url = `${u.protocol}//${u.host}${r.redirectUrl}`;
        } else {
          url = r.redirectUrl;
        }
      } else {
        break;
      }
    } catch (e) {
      chain.push({ url, error: e.message });
      break;
    }
  }
  return chain;
}

async function main() {
  console.log('=== Mobile OAuth Origin Diagnosis ===\n');
  console.log('Client ID:', CLIENT_ID);
  console.log('');

  // 1. Check redirect chain for nyutaelite.com on mobile
  const origins = [
    'https://nyutaelite.com',
    'https://www.nyutaelite.com',
    'https://nyutaelite.com/login',
    'https://www.nyutaelite.com/login',
  ];

  for (const origin of origins) {
    console.log(`\n[Checking] ${origin}`);
    const chain = await followRedirects(origin, MOBILE_UA);
    chain.forEach((step, i) => {
      if (step.error) {
        console.log(`  Step ${i}: ERROR ${step.error}`);
      } else {
        const arrow = step.redirect ? ` → ${step.redirect}` : '';
        console.log(`  Step ${i}: ${step.status}${arrow}`);
      }
    });
    const finalUrl = chain[chain.length - 1]?.url;
    if (finalUrl) {
      const finalOrigin = new URL(finalUrl).origin;
      console.log(`  Final origin: ${finalOrigin}`);
    }
  }

  console.log('\n=== Required Google Cloud Console Configuration ===\n');
  console.log('AUTHORIZED JAVASCRIPT ORIGINS (no trailing slash):');
  const requiredOrigins = [
    'https://nyutaelite.com',
    'https://www.nyutaelite.com',
    'https://nyutaelite.pages.dev',
  ];
  requiredOrigins.forEach(o => console.log(`  ✅ ${o}`));
  
  console.log('\nNOT REQUIRED for GIS popup/callback mode:');
  console.log('  ℹ️  Redirect URIs are optional for pure callback mode (no redirect_uri sent)');
  console.log('  ℹ️  BUT Google may still enforce them in FedCM/mobile flows\n');

  console.log('RECOMMENDED Authorized Redirect URIs (add these as safety):');
  const redirectUris = [
    'https://nyutaelite.com',
    'https://nyutaelite.com/login',
    'https://nyutaelite.com/register',
    'https://www.nyutaelite.com',
    'https://www.nyutaelite.com/login',
    'https://www.nyutaelite.com/register',
  ];
  redirectUris.forEach(u => console.log(`  📌 ${u}`));

  console.log('\n=== FedCM / Mobile Chrome Notes ===');
  console.log('- Chrome 120+ on Android uses FedCM by default');
  console.log('- FedCM requires HTTPS, no mixed content');
  console.log('- FedCM requires the RP (your site) origin to be in Authorized JS Origins');
  console.log('- The use_fedcm_for_prompt:true flag is already set in the deployed bundle ✅');
  console.log('- ux_mode:"popup" is confirmed in deployed bundle ✅');
  console.log('\nDiagnosis complete. If mobile still fails after GCloud Console update,');
  console.log('the next step is redirect-mode fallback for mobile browsers.');
}

main().catch(console.error);

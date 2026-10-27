// scripts/diagnose_ga4_network.mjs
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://nyutaelite.com';

console.log('=== Diagnosing Live GA4 Network Requests ===\n');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const networkTraffic = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com') || url.includes('collect')) {
      networkTraffic.push({ type: 'REQ', method: req.method(), url });
    }
  });

  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com') || url.includes('collect')) {
      networkTraffic.push({ type: 'RES', status: res.status(), url });
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com') || url.includes('collect')) {
      networkTraffic.push({ type: 'FAILED', error: req.failure()?.errorText, url });
    }
  });

  page.on('console', (msg) => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  console.log('1. Navigating to homepage...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  console.log('2. Accepting consent...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const allowBtn = btns.find((b) => b.textContent && b.textContent.includes('Allow Analytics'));
    if (allowBtn) allowBtn.click();
  });

  // Wait 5 seconds to let gtag.js download and send collect pings
  console.log('3. Waiting for network traffic after consent...');
  await new Promise((r) => setTimeout(r, 6000));

  console.log('4. Navigating to a product page...');
  await page.goto(`${TARGET_URL}/products/makhana?sku=premium-100g`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 6000));

  console.log('\n--- GA4 & GTM Network Traffic Recorded ---');
  for (const item of networkTraffic) {
    console.log(`[${item.type}] ${item.status || item.method || item.error || ''} -> ${item.url.slice(0, 120)}...`);
  }

  const collectHits = networkTraffic.filter((t) => t.url.includes('/g/collect') || t.url.includes('/collect'));
  console.log(`\nTotal collect hits: ${collectHits.length}`);

  // Let's inspect window.dataLayer inside the browser
  const dl = await page.evaluate(() => {
    return window.dataLayer;
  });
  console.log('\nwindow.dataLayer dump:', JSON.stringify(dl, null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

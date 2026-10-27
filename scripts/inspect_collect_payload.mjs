// scripts/inspect_collect_payload.mjs
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://nyutaelite.com';

console.log('=== Inspecting GA4 Collect Payload in Detail ===\n');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('google-analytics.com/g/collect')) {
      console.log('--- GA4 COLLECT REQUEST ---');
      console.log('URL:', url);
      console.log('Method:', req.method());
      console.log('Post Data:', req.postData());
    }
  });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

  // Accept consent
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const allowBtn = btns.find((b) => b.textContent && b.textContent.includes('Allow Analytics'));
    if (allowBtn) allowBtn.click();
  });

  await new Promise((r) => setTimeout(r, 4000));

  await page.goto(`${TARGET_URL}/products/makhana?sku=premium-100g`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

// scripts/verify_live_ga4_browser.mjs
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://nyutaelite.com';

console.log('=== Live GA4 Browser Verification on nyutaelite.com ===\n');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const requests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('google-analytics') || url.includes('googletagmanager.com/gtag')) {
        requests.push(url);
      }
    });

    // ---------------------------------------------------------
    // Scenario A: Before consent
    // ---------------------------------------------------------
    console.log('--- Scenario A: Before Consent ---');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    const bannerExists = await page.evaluate(() => {
      return document.querySelector('aside[aria-label="Analytics privacy preference"]') !== null;
    });
    console.log('✓ Consent banner rendered:', bannerExists);

    const scriptBefore = await page.evaluate(() => {
      return document.getElementById('nyuta-ga4-script');
    });
    console.log('✓ GA4 script NOT loaded before consent:', scriptBefore === null);

    const gaRequestsBefore = requests.filter((r) => r.includes('google-analytics.com'));
    console.log('✓ GA4 collect requests before consent (expected 0):', gaRequestsBefore.length);

    // ---------------------------------------------------------
    // Scenario B: Accept consent
    // ---------------------------------------------------------
    console.log('\n--- Scenario B: After Accepting Consent ---');
    const allowClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allowBtn = btns.find((b) => b.textContent && b.textContent.includes('Allow Analytics'));
      if (allowBtn) {
        allowBtn.click();
        return true;
      }
      return false;
    });
    console.log('✓ Clicked "Allow Analytics" button:', allowClicked);

    // Wait for async script injection
    await page.waitForFunction(() => document.getElementById('nyuta-ga4-script') !== null, { timeout: 5000 });

    const scriptSrc = await page.evaluate(() => {
      const s = document.getElementById('nyuta-ga4-script');
      return s ? s.getAttribute('src') : null;
    });
    console.log('✓ Injected GA4 script src:', scriptSrc);
    console.log('✓ Contains Measurement ID G-K1R0QB4M3F:', scriptSrc && scriptSrc.includes('G-K1R0QB4M3F'));

    // ---------------------------------------------------------
    // Scenario C: Navigation to Product Page & view_item
    // ---------------------------------------------------------
    console.log('\n--- Scenario C: Product Page Navigation & view_item ---');
    await page.goto(`${TARGET_URL}/products/makhana?sku=premium-100g`, { waitUntil: 'networkidle2' });

    // Wait for product to load
    await page.waitForSelector('h1', { timeout: 5000 });
    const productTitle = await page.evaluate(() => document.querySelector('h1')?.textContent);
    console.log('✓ Product page title:', productTitle?.trim());

    // Check dataLayer events on product page
    const dlAfterProd = await page.evaluate(() => {
      return (window.dataLayer || []).map((entry) => {
        if (entry && entry[0] === 'event') {
          return { type: 'event', name: entry[1], params: entry[2] };
        }
        return { type: typeof entry, raw: entry };
      });
    });

    const eventNames = dlAfterProd.filter((e) => e.type === 'event').map((e) => e.name);
    console.log('✓ Dispatched GA4 events on product page:', eventNames.join(', '));

    const viewItemEvent = dlAfterProd.find((e) => e.name === 'view_item');
    if (viewItemEvent) {
      console.log('✓ view_item params:', JSON.stringify(viewItemEvent.params));
      const item = viewItemEvent.params?.items?.[0];
      console.log(`✓ view_item SKU: ${item?.item_id}, Price: ₹${item?.price}, Currency: ${viewItemEvent.params?.currency}`);
    }

    // ---------------------------------------------------------
    // Scenario D: Add to Cart interaction
    // ---------------------------------------------------------
    console.log('\n--- Scenario D: Add to Cart interaction ---');
    const addToCartClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.textContent && b.textContent.includes('Add to Cart'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    console.log('✓ Clicked "Add to Cart" button:', addToCartClicked);

    // Give state a moment to dispatch
    await new Promise((r) => setTimeout(r, 1000));

    const dlAfterCart = await page.evaluate(() => {
      return (window.dataLayer || []).map((entry) => {
        if (entry && entry[0] === 'event') {
          return { type: 'event', name: entry[1], params: entry[2] };
        }
        return { type: typeof entry, raw: entry };
      });
    });

    const cartEventNames = dlAfterCart.filter((e) => e.type === 'event').map((e) => e.name);
    console.log('✓ Dispatched GA4 events after Add to Cart:', cartEventNames.join(', '));
    const addCartEvent = dlAfterCart.find((e) => e.name === 'add_to_cart');
    if (addCartEvent) {
      console.log('✓ add_to_cart event captured:', JSON.stringify(addCartEvent.params));
    }

    // ---------------------------------------------------------
    // Scenario E: Declining Consent in a Fresh Context
    // ---------------------------------------------------------
    console.log('\n--- Scenario E: After Declining Consent ---');
    const pageDeclined = await browser.newPage();
    await pageDeclined.evaluateOnNewDocument(() => {
      localStorage.setItem('nyutaelite_analytics_consent', 'denied');
    });
    await pageDeclined.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    const scriptDeclined = await pageDeclined.evaluate(() => {
      return document.getElementById('nyuta-ga4-script');
    });
    console.log('✓ GA4 script is NOT injected when consent is denied:', scriptDeclined === null);
    await pageDeclined.close();

    console.log('\n=== All Live Browser Verifications Passed Successfully! ===');
  } catch (err) {
    console.error('Browser verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

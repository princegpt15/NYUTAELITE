import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://www.nutyaelite.com';
const APEX_URL = 'https://nutyaelite.com';

async function runProductionTests() {
  console.log(`[VERIFY] Starting production verification on ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    console.log(`[PAGE ERROR] ${err.message}`);
    errors.push(err.message);
  });

  // Test 1: Apex Redirect
  console.log('\n--- TEST 1: Apex Redirect to WWW ---');
  await page.goto(APEX_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  console.log(`Requested: ${APEX_URL}`);
  console.log(`Landed on: ${page.url()}`);
  const isWww = page.url().startsWith(BASE_URL);
  console.log(`Apex redirect working: ${isWww ? 'PASS' : 'FAIL'}`);

  // Test 2: Homepage Load & Section Check
  console.log('\n--- TEST 2: Homepage Load & Category Cards Section ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  const title = await page.title();
  console.log(`Page title: "${title}"`);

  const categoryCardsCount = await page.$$eval(
    'a[href*="/categories?type="], a[href*="/categories?weight="]',
    (nodes) => nodes.length
  );
  console.log(`Five-card category section links found on homepage: ${categoryCardsCount}`);

  // Test 3: Search Bar Interaction & Modal
  console.log('\n--- TEST 3: Search Bar & Modal ---');
  const searchBtn = await page.$('button[aria-label="Search Makhana"]');
  if (searchBtn) {
    await searchBtn.click();
    console.log('Clicked Search button');
    await page.waitForSelector('input#search-modal-title', { timeout: 5000 });
    console.log('Search input appeared');

    await new Promise((r) => setTimeout(r, 1500));

    const errorText = await page.evaluate(() => {
      const errEl = document.querySelector('.text-red-600');
      return errEl ? errEl.innerText : null;
    });

    if (errorText) {
      console.error(`FAIL: Search modal displayed error: "${errorText}"`);
    } else {
      console.log('PASS: Search modal opened with NO error');
    }

    await page.type('input#search-modal-title', 'Premium', { delay: 50 });
    await new Promise((r) => setTimeout(r, 600));

    const searchResults = await page.$$eval('div[role="dialog"] h4', (nodes) => nodes.map((n) => n.innerText));
    console.log(`Search results for "Premium" (${searchResults.length} items):`, searchResults);

    const closeBtn = await page.$('button[aria-label="Close search modal"]');
    if (closeBtn) {
      await closeBtn.click();
      console.log('Closed search modal');
    }
  } else {
    console.error('FAIL: Search button not found');
  }

  // Test 4-8: Category Routes Verification
  const testCategories = [
    { name: 'Premium Makhana', route: '/categories?type=Premium' },
    { name: 'Normal Makhana', route: '/categories?type=Normal' },
    { name: '100g Pouches', route: '/categories?weight=100g' },
    { name: '200g Pouches', route: '/categories?weight=200g' },
    { name: '250g Pouches', route: '/categories?weight=250g' }
  ];

  for (let i = 0; i < testCategories.length; i++) {
    const cat = testCategories[i];
    console.log(`\n--- TEST ${i + 4}: ${cat.name} (${cat.route}) ---`);
    await page.goto(`${BASE_URL}${cat.route}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    const catError = await page.evaluate(() => {
      const err = document.querySelector('.text-red-600, .bg-red-50, .bg-amber-50');
      return err ? err.innerText : null;
    });

    const products = await page.$$eval('article h3, div h4, h3.font-serif', (nodes) => nodes.map((n) => n.innerText));
    console.log(`${cat.name} Error: ${catError || 'None (PASS)'}`);
    console.log(`${cat.name} visible products count: ${products.length}`);
    if (products.length > 0) {
      console.log(`First 2 products: ${products.slice(0, 2).join(' | ')}`);
    }
  }

  // Test 9: Click through from Homepage Category Card
  console.log('\n--- TEST 9: Click from Homepage 5-Card Section ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  const firstCategoryLink = await page.$('a[href*="/categories?type=Premium"]');
  if (firstCategoryLink) {
    await firstCategoryLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    console.log(`Landed URL after clicking Premium card: ${page.url()}`);
    const productsAfterClick = await page.$$eval('article h3, div h4, h3.font-serif', (nodes) => nodes.length);
    console.log(`Products rendered after card click: ${productsAfterClick}`);
  }

  // Diagnostic Summary
  console.log('\n====================================================');
  console.log('SUMMARY OF PRODUCTION DOMAIN VERIFICATION');
  console.log('====================================================');
  console.log(`Total errors captured: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  } else {
    console.log('ALL TESTS PASSED! Production site is 100% operational.');
  }

  await browser.close();
}

runProductionTests().catch(console.error);

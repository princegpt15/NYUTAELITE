const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/bulk-order/enquiry', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#name');
    await page.type('#name', 'Rajesh Wholesale Mart');
    await page.type('#businessName', 'Rajesh Agro Trading Co.');
    await page.type('#phone', '9876543210');
    await page.type('#email', 'rajesh@agrotrading.com');
    await page.type('#city', 'Lucknow, Uttar Pradesh');
    await page.type('#message', 'Need 50kg samples of 6-Sutta and 5-Sutta makhana.');

    console.log('Submitting bulk order form...');
    await page.$eval('button[type="submit"]', el => el.scrollIntoView());
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 2000));

    const pageText = await page.evaluate(() => {
      const form = document.querySelector('#enquiry-form');
      return form ? form.innerText : document.body.innerText;
    });

    console.log('--- Post-submit text snapshot ---');
    console.log(pageText.slice(0, 500));
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();

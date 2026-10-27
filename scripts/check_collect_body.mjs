import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  page.on('request', (r) => {
    if (r.url().includes('collect')) {
      console.log('--- COLLECT REQUEST ---');
      console.log('Method:', r.method());
      console.log('URL:', r.url());
      console.log('PostData:', r.postData());
    }
  });
  page.on('response', (res) => {
    if (res.url().includes('collect')) {
      console.log('--- COLLECT RESPONSE ---');
      console.log('Status:', res.status());
    }
  });
  await page.goto('https://nyutaelite.com', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const allowBtn = btns.find((b) => b.textContent && b.textContent.includes('Allow Analytics'));
    if (allowBtn) allowBtn.click();
  });
  await new Promise((r) => setTimeout(r, 6000));
  await browser.close();
}

test().catch(console.error);

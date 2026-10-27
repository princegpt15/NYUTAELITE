import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkLogin() {
  console.log('[VERIFY] Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[BROWSER CONSOLE ERROR]:', msg.text());
    }
  });

  console.log('[VERIFY] Navigating to https://nyutaelite.com/login ...');
  await page.goto('https://nyutaelite.com/login', { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  const title = await page.title();

  const googleIframeExists = await page.evaluate(() => {
    const iframes = Array.from(document.querySelectorAll('iframe'));
    return iframes.some(f => f.src && f.src.includes('accounts.google.com'));
  });

  const otpFound = /OTP|Mobile Number|phone number|Get OTP/i.test(text);

  console.log('--- RESULTS ---');
  console.log('Title:', title);
  console.log('Google iframe rendered:', googleIframeExists);
  console.log('OTP text detected on page:', otpFound);
  console.log('Page Text Excerpt:\n', text.split('\n').filter(l => l.trim()).slice(0, 15).join('\n'));
  console.log('Console Errors count:', consoleErrors.length);

  if (!fs.existsSync('screenshots-verification')) {
    fs.mkdirSync('screenshots-verification', { recursive: true });
  }

  await page.screenshot({ path: 'screenshots-verification/login-google-auth.png', fullPage: true });
  console.log('[VERIFY] Saved screenshot to screenshots-verification/login-google-auth.png');

  // Also check register page
  console.log('[VERIFY] Navigating to https://nyutaelite.com/register ...');
  await page.goto('https://nyutaelite.com/register', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const regText = await page.evaluate(() => document.body.innerText);
  const regOtpFound = /OTP/i.test(regText);
  console.log('Register OTP text detected:', regOtpFound);
  await page.screenshot({ path: 'screenshots-verification/register-google-auth.png', fullPage: true });
  console.log('[VERIFY] Saved screenshot to screenshots-verification/register-google-auth.png');

  await browser.close();
}

checkLogin().catch(err => {
  console.error('[FATAL]:', err);
  process.exit(1);
});

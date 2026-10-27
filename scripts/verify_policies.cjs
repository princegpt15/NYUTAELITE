// scripts/verify_policies.cjs
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '../scratch/policy_verification');
if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

async function verify() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('nyutaelite_analytics_consent', 'granted');
    });

    console.log('=== TEST 1: Inspecting Policy Sections on Desktop (1280x900) ===');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle2' });

    // Verify all policy anchor elements exist
    const policyElements = await page.evaluate(() => {
      const ids = ['shipping', 'refund', 'privacy', 'terms', 'fssai', 'checklist'];
      return ids.map((id) => {
        const el = document.getElementById(id);
        return {
          id,
          exists: !!el,
          title: el?.querySelector('h3')?.textContent?.trim() || null,
        };
      });
    });

    console.log('Policy Elements Status:', policyElements);

    // Capture screenshots of each section
    for (const p of policyElements) {
      if (p.exists) {
        await page.evaluate((id) => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
        }, p.id);
        await new Promise((r) => setTimeout(r, 400));
        await page.screenshot({ path: path.join(shotDir, `policy_${p.id}_desktop.png`) });
        console.log(`  Saved screenshot: scratch/policy_verification/policy_${p.id}_desktop.png`);
      }
    }

    console.log('\n=== TEST 2: Testing Direct Route Aliases (/shipping, /privacy, etc.) ===');
    const routesToTest = [
      { url: 'http://localhost:5173/shipping', expectedHash: '#shipping' },
      { url: 'http://localhost:5173/returns', expectedHash: '#refund' },
      { url: 'http://localhost:5173/privacy', expectedHash: '#privacy' },
      { url: 'http://localhost:5173/terms', expectedHash: '#terms' },
      { url: 'http://localhost:5173/fssai', expectedHash: '#fssai' },
    ];

    for (const r of routesToTest) {
      await page.goto(r.url, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 500));
      const currentUrl = page.url();
      console.log(`  Route: ${r.url} -> Current: ${currentUrl} (Valid? ${currentUrl.includes(r.expectedHash)})`);
    }

    console.log('\n=== TEST 3: Inspecting Policy Hub on Mobile (390x844) ===');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/about#shipping', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(shotDir, 'policy_shipping_mobile.png') });
    console.log('  Saved mobile screenshot: scratch/policy_verification/policy_shipping_mobile.png');

    await page.goto('http://localhost:5173/about#fssai', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(shotDir, 'policy_fssai_mobile.png') });
    console.log('  Saved mobile screenshot: scratch/policy_verification/policy_fssai_mobile.png');

    console.log('\n=== TEST 4: Footer Policy Links Verification ===');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    const footerLinks = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const links = Array.from(footer.querySelectorAll('a')).map((a) => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
      }));
      return links.filter(
        (l) =>
          l.href &&
          (l.href.includes('shipping') ||
            l.href.includes('refund') ||
            l.href.includes('privacy') ||
            l.href.includes('terms') ||
            l.href.includes('fssai') ||
            l.href.includes('checklist'))
      );
    });

    console.log('Footer Policy Links:', footerLinks);
  } finally {
    await browser.close();
  }
}

verify().catch(console.error);

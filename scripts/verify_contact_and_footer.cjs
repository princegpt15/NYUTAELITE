const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '../scratch/contact_verification');
if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

async function verify() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    console.log('=== TEST 1: Inspecting Website Footer on Desktop (1280x800) ===');
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('nyutaelite_analytics_consent', 'granted');
    });
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

    // Scroll to footer
    await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));

    const footerData = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return null;

      const links = Array.from(footer.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim(),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel')
      }));

      const phoneLink = links.find(l => l.href && l.href.startsWith('tel:'));
      const mailtoLinks = links.filter(l => l.href && l.href.startsWith('mailto:'));
      const webLink = links.find(l => l.href && (l.href.startsWith('http://') || l.href.startsWith('https://')) && l.href.includes('nutyaelite.com'));
      const devLink = links.find(l => l.href && l.href.includes('linkedin.com'));
      const footerText = footer.textContent;

      return {
        phoneLink,
        mailtoLinks,
        webLink,
        devLink,
        hasAttributionText: footerText.includes('Website crafted by') && footerText.includes('Prince Kumar'),
        allLinksCount: links.length
      };
    });

    console.log('Footer Links & Attribution Analysis:');
    console.log('  Phone link:', footerData.phoneLink);
    console.log('  Email links:', footerData.mailtoLinks);
    console.log('  Website link:', footerData.webLink);
    console.log('  Developer link:', footerData.devLink);
    console.log('  Has "Website crafted by Prince Kumar":', footerData.hasAttributionText);

    await page.screenshot({ path: path.join(shotDir, 'footer_desktop_1280.png') });
    console.log('  Saved screenshot: scratch/contact_verification/footer_desktop_1280.png');

    console.log('\n=== TEST 2: Inspecting Website Footer on Tablet (768x1024) ===');
    await page.setViewport({ width: 768, height: 1024 });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(shotDir, 'footer_tablet_768.png') });
    console.log('  Saved screenshot: scratch/contact_verification/footer_tablet_768.png');

    console.log('\n=== TEST 3: Inspecting Website Footer on Mobile (390x844) ===');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(shotDir, 'footer_mobile_390.png') });
    console.log('  Saved screenshot: scratch/contact_verification/footer_mobile_390.png');

    console.log('\n=== TEST 4: Inspecting Contact Us Page (/contact) on Desktop ===');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const contactPageData = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')).map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim(),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel')
      }));

      const phoneLink = links.find(l => l.href && l.href.startsWith('tel:'));
      const mailtoLinks = links.filter(l => l.href && l.href.startsWith('mailto:'));
      const webLink = links.find(l => l.href && (l.href.startsWith('http://') || l.href.startsWith('https://')) && l.href.includes('nutyaelite.com'));

      return {
        phoneLink,
        mailtoLinks,
        webLink
      };
    });

    console.log('Contact Us Page Links Analysis:');
    console.log('  Phone link:', contactPageData.phoneLink);
    console.log('  Email links:', contactPageData.mailtoLinks);
    console.log('  Website link:', contactPageData.webLink);

    await page.screenshot({ path: path.join(shotDir, 'contact_page_desktop.png') });
    console.log('  Saved screenshot: scratch/contact_verification/contact_page_desktop.png');

    console.log('\n=== TEST 5: Inspecting Contact Us Page (/contact) on Mobile ===');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(shotDir, 'contact_page_mobile.png') });
    console.log('  Saved screenshot: scratch/contact_verification/contact_page_mobile.png');

  } finally {
    await browser.close();
  }
}

verify().catch(console.error);

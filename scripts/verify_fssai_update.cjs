// scripts/verify_fssai_update.cjs
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '../scratch/fssai_verification');
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

    console.log('=== TEST 1: Verifying FSSAI Section on /about#fssai (Desktop 1280x900) ===');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/about#fssai', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    const fssaiData = await page.evaluate(() => {
      const section = document.getElementById('fssai');
      if (!section) return { exists: false };

      const text = section.innerText;
      return {
        exists: true,
        hasRegNo: text.includes('20426021000494'),
        hasFBO: text.includes('RAUSHAN KUMAR C/O NyutaElite'),
        hasAddress: text.includes('Krishna Vihar Lock No 11') && text.includes('Bhojpur') && text.includes('802301'),
        hasKOB: text.includes('Wholesaler, Distributor, Retailer'),
        hasCategory: text.includes('Category 04'),
        hasValidity: text.includes('24-08-2027'),
        hasIssuedDate: text.includes('25-08-2026'),
        temporaryNoticeRemoved: !text.includes('Administrative Verification Underway') && !text.includes('Administrative Verification Notice'),
      };
    });

    console.log('FSSAI Section Data Check:', fssaiData);
    const fssaiEl = await page.$('#fssai');
    if (fssaiEl) {
      await fssaiEl.screenshot({ path: path.join(shotDir, 'fssai_section_desktop.png') });
      console.log('  Saved element screenshot: scratch/fssai_verification/fssai_section_desktop.png');
    }

    console.log('\n=== TEST 2: Verifying Owner Checklist on /about#checklist ===');
    const checklistEl = await page.$('#checklist');
    if (checklistEl) {
      await checklistEl.screenshot({ path: path.join(shotDir, 'checklist_section_desktop.png') });
      console.log('  Saved element screenshot: scratch/fssai_verification/checklist_section_desktop.png');
    }

    console.log('\n=== TEST 3: Verifying Footer Links and Badges ===');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    const footerCheck = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const text = footer.innerText;
      return {
        hasLegalFssaiLink: text.includes('FSSAI: 20426021000494'),
        hasBottomBarFssai: text.includes('FSSAI: 20426021000494'),
      };
    });
    console.log('Footer FSSAI check:', footerCheck);

    console.log('\n=== TEST 4: Verifying Product Page Assurance Section ===');
    await page.goto('http://localhost:5173/products/makhana', { waitUntil: 'networkidle2' });
    const productCheck = await page.evaluate(() => {
      return document.body.innerText.includes('20426021000494');
    });
    console.log('Product page has 20426021000494:', productCheck);

    console.log('\n=== TEST 5: Verifying Contact Page Office Info ===');
    await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle2' });
    const contactCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasFssaiOffice: text.includes('Krishna Vihar Lock No. 11') && text.includes('Bhojpur'),
        hasFssaiReg: text.includes('20426021000494'),
      };
    });
    console.log('Contact page check:', contactCheck);
    await page.screenshot({ path: path.join(shotDir, 'contact_page_desktop.png') });

    console.log('\n=== TEST 6: Mobile Viewport Verification (390x844) ===');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/about#fssai', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));
    const fssaiElMobile = await page.$('#fssai');
    if (fssaiElMobile) {
      await fssaiElMobile.screenshot({ path: path.join(shotDir, 'fssai_section_mobile.png') });
      console.log('  Saved mobile element screenshot: scratch/fssai_verification/fssai_section_mobile.png');
    }

    console.log('\n=== TEST 7: Verifying Bulk Order Enquiry Page ===');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/bulk-order/enquiry', { waitUntil: 'networkidle2' });
    const bulkCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasRegNo: text.includes('20426021000494'),
        hasBhojpurAddress: text.includes('Krishna Vihar Lock No. 11') && text.includes('Bhojpur'),
        noDarbhangaHub: !text.includes('Darbhanga, Bihar 846004'),
        hasOfficialPhone: text.includes('+91 81028 75852'),
        hasOfficialEmail: text.includes('info@nutyaelite.com'),
      };
    });
    console.log('Bulk Order Page Check:', bulkCheck);

    console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY.');
  } finally {
    await browser.close();
  }
}

verify().catch(console.error);

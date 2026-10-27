const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '../scratch');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verify() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('--- Step 1: Checking Bulk Order Qualities Page (/bulk-order/qualities) ---');
    await page.goto('http://localhost:5173/bulk-order/qualities', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const gradeCardsInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h2')).map(h2 => {
        const title = h2.textContent.trim();
        const cardContainer = h2.closest('.relative.bg-white') || h2.closest('div');
        const img = cardContainer ? cardContainer.querySelector('img') : null;
        return {
          title,
          imgSrc: img ? img.src : null,
          naturalWidth: img ? img.naturalWidth : 0,
          naturalHeight: img ? img.naturalHeight : 0,
          clientWidth: img ? img.clientWidth : 0,
          clientHeight: img ? img.clientHeight : 0,
          complete: img ? img.complete : false
        };
      });
      return cards.filter(c => c.title.includes('Sutta'));
    });

    console.log('Grade Cards Found:');
    gradeCardsInfo.forEach(c => {
      console.log(`  ${c.title}:`);
      console.log(`    src: ${c.imgSrc}`);
      console.log(`    naturalSize: ${c.naturalWidth}x${c.naturalHeight}, clientSize: ${c.clientWidth}x${c.clientHeight}`);
      console.log(`    complete: ${c.complete}`);
    });

    // Capture screenshot of the 4 grade cards
    await page.screenshot({ path: path.join(outDir, 'bulk-order-grades-verified.png') });
    console.log('Saved screenshot: scratch/bulk-order-grades-verified.png');

    console.log('\n--- Step 2: Checking Bulk Order Choice Modal & WhatsApp Image ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Find and click the Order in Bulk button / link
    const bulkButtonFound = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const target = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('order in bulk'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    if (bulkButtonFound) {
      console.log('Clicked "Order in Bulk" button on homepage.');
      await new Promise(r => setTimeout(r, 800));

      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
        if (!modal) return null;

        const whatsappHeader = Array.from(modal.querySelectorAll('h3')).find(h => h.textContent.includes('Order via WhatsApp'));
        const optionBContainer = whatsappHeader ? whatsappHeader.closest('.bg-white') : null;
        const img = optionBContainer ? optionBContainer.querySelector('img') : null;
        const link = optionBContainer ? optionBContainer.querySelector('a') : null;

        return {
          headerFound: !!whatsappHeader,
          imgSrc: img ? img.src : null,
          imgAlt: img ? img.alt : null,
          naturalWidth: img ? img.naturalWidth : 0,
          naturalHeight: img ? img.naturalHeight : 0,
          clientWidth: img ? img.clientWidth : 0,
          clientHeight: img ? img.clientHeight : 0,
          complete: img ? img.complete : false,
          linkHref: link ? link.href : null,
          linkText: link ? link.textContent.trim() : null
        };
      });

      console.log('Modal Option B WhatsApp Card Info:');
      console.log(modalInfo);

      await page.screenshot({ path: path.join(outDir, 'bulk-choice-modal-verified.png') });
      console.log('Saved screenshot: scratch/bulk-choice-modal-verified.png');
    } else {
      console.error('Could not find "Order in Bulk" trigger on homepage.');
    }

  } finally {
    await browser.close();
  }
}

verify().catch(console.error);

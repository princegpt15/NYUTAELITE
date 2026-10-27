const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const screenshotDir = path.join(__dirname, '../screenshots-verification');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function verifyPage(url, pageName, viewports) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Scroll smoothly down the page to trigger lazy loaded images
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 400;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      });

      // Wait a moment for network idle after scrolling
      await new Promise(r => setTimeout(r, 1000));

      // Check all images
      const imgReport = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          clientWidth: img.clientWidth,
          clientHeight: img.clientHeight,
          displayed: img.offsetWidth > 0 && img.offsetHeight > 0,
          complete: img.complete
        }));
      });

      console.log(`\n=== Report for ${pageName} (${vp.name}: ${vp.width}x${vp.height}) ===`);
      let failedImgs = 0;
      imgReport.forEach((img, idx) => {
        const isOk = img.complete && img.naturalWidth > 0;
        if (!isOk) {
          failedImgs++;
          console.error(`  [FAILED] #${idx} src: ${img.src} (naturalWidth: ${img.naturalWidth})`);
        }
      });
      console.log(`  Total images: ${imgReport.length}, Healthy: ${imgReport.length - failedImgs}, Failed: ${failedImgs}`);

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, hasOverflow: docW > winW };
      });
      console.log(`  Overflow check: documentWidth=${overflow.docW}, windowWidth=${overflow.winW}, hasOverflow=${overflow.hasOverflow}`);

      // Save screenshot
      const shotPath = path.join(screenshotDir, `${pageName}-${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`  Saved screenshot: ${shotPath}`);
    }

    // Scroll to specific sections on desktop and take targeted screenshots
    if (pageName === 'home') {
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(url, { waitUntil: 'networkidle2' });

      const sections = [
        { id: 'pantry', name: '01-pantry-cards' },
        { id: 'quality', name: '02-quality-comparison' },
        { id: 'why-makhana', name: '03-why-makhana' }
      ];

      for (const sec of sections) {
        const el = await page.$(`#${sec.id}`);
        if (el) {
          await el.scrollIntoView();
          await new Promise(r => setTimeout(r, 400));
          const shotPath = path.join(screenshotDir, `section-${sec.name}.png`);
          await el.screenshot({ path: shotPath });
          console.log(`  Saved section screenshot: ${shotPath}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
}

async function run() {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'desktop', width: 1280, height: 800 }
  ];

  console.log('Testing Home page...');
  await verifyPage('http://localhost:5173/', 'home', viewports);

  console.log('\nTesting Bulk Order page...');
  await verifyPage('http://localhost:5173/bulk-order', 'bulk-order', viewports);

  console.log('\nTesting Bulk Order Qualities page...');
  await verifyPage('http://localhost:5173/bulk-order/qualities', 'bulk-qualities', viewports);

  console.log('\nTesting Categories page...');
  await verifyPage('http://localhost:5173/categories', 'categories', viewports);

  console.log('\nTesting Contact page...');
  await verifyPage('http://localhost:5173/contact', 'contact', viewports);

  console.log('\nTesting Play page...');
  await verifyPage('http://localhost:5173/play', 'play', viewports);

  console.log('\nTesting About page...');
  await verifyPage('http://localhost:5173/about', 'about', viewports);

  console.log('\nTesting Product SKU page...');
  await verifyPage('http://localhost:5173/products/makhana', 'products', viewports);
}

run().catch(console.error);

import puppeteer from 'puppeteer';

(async () => {
  // Launch headless Chromium
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Mobile viewport settings
  const viewport = {
    width: 390,
    height: 800, // initial height; will be expanded later
    deviceScaleFactor: 2, // retina
    isMobile: true,
    hasTouch: true,
  };
  await page.setViewport(viewport);

  const url = 'http://localhost:5173/';
  console.log(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Scroll to bottom to trigger lazy-loaded resources
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const totalHeight = document.body.scrollHeight;
      const distance = 100;
      let scrolled = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        scrolled += distance;
        if (scrolled >= totalHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Ensure any remaining network activity is done
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get the full height of the page after scrolling
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Full page height:', fullHeight);

  // Adjust PDF dimensions (width in inches approximated from px @ 96 DPI)
  const widthInInches = (viewport.width / 96).toFixed(2) + 'in';
  const heightInInches = (fullHeight / 96).toFixed(2) + 'in';

  const outputPath = 'NYUTA_ELITE_MAKHANA_Mobile_Website.pdf';
  await page.pdf({
    path: outputPath,
    printBackground: true,
    width: widthInInches,
    height: heightInInches,
    margin: { top: '0in', bottom: '0in', left: '0in', right: '0in' },
  });

  console.log(`PDF saved to ${outputPath}`);
  await browser.close();
})();

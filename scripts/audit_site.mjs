import puppeteer from 'puppeteer-core';

async function runAudit() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox']
  });
  
  const pagesToTest = [
    '/',
    '/categories',
    '/categories?type=Premium',
    '/categories?type=Normal',
    '/products/makhana?sku=premium-100g',
    '/products/makhana?sku=normal-250g',
    '/cart',
    '/checkout',
    '/login',
    '/register',
    '/about',
    '/contact',
    '/faq'
  ];

  const results = {};

  for (const path of pagesToTest) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('GSI_LOGGER') && !txt.includes('React DevTools')) {
          consoleErrors.push(txt);
        }
      }
    });

    page.on('requestfailed', req => {
      failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
    });

    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('/api/auth/')) {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    await page.setViewport({ width: 1280, height: 900 });
    try {
      await page.goto('http://localhost:5173' + path, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));
      // Scroll to trigger lazy-loaded images
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1200));
      
      // Check images
      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.clientWidth,
          height: img.clientHeight
        }));
      });

      const brokenImages = images.filter(i => i.naturalWidth === 0);
      const missingAlt = images.filter(i => !i.alt || i.alt.trim() === '');

      // Check headings structure
      const headings = await page.evaluate(() => {
        return {
          h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
          h2Count: document.querySelectorAll('h2').length,
          h3Count: document.querySelectorAll('h3').length,
        };
      });

      // Check title and meta description
      const title = await page.title();
      const metaDesc = await page.evaluate(() => {
        const el = document.querySelector('meta[name="description"]');
        return el ? el.getAttribute('content') : null;
      });

      // Check interactive accessibility items
      const a11yChecks = await page.evaluate(() => {
        const buttonsWithoutAriaOrText = Array.from(document.querySelectorAll('button')).filter(b => {
          const text = b.textContent?.trim();
          const ariaLabel = b.getAttribute('aria-label');
          const title = b.getAttribute('title');
          return !text && !ariaLabel && !title;
        }).length;

        const inputsWithoutLabels = Array.from(document.querySelectorAll('input:not([type="hidden"])')).filter(i => {
          const id = i.id;
          const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
          const ariaLabel = i.getAttribute('aria-label');
          const placeholder = i.getAttribute('placeholder');
          return !hasLabel && !ariaLabel && !placeholder;
        }).length;

        return {
          buttonsWithoutAriaOrText,
          inputsWithoutLabels
        };
      });

      results[path] = {
        title,
        hasMetaDesc: Boolean(metaDesc),
        h1Count: headings.h1.length,
        h1Text: headings.h1,
        totalImages: images.length,
        brokenImages: brokenImages.length,
        brokenImageSrcs: brokenImages.map(b => b.src),
        missingAlt: missingAlt.length,
        missingAltSrcs: missingAlt.map(m => m.src),
        a11y: a11yChecks,
        consoleErrors,
        failedRequests
      };
    } catch (err) {
      results[path] = { error: err.message };
    }
    await page.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

runAudit().catch(console.error);

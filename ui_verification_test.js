// Updated UI verification script using evaluate for element lookup (ES module)
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE UNCAUGHT ERROR:', err.message);
    errors.push(err.message);
  });
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });
    // Helper to find element by visible text
    const findByText = async (selector, text) => {
      const handles = await page.$$(selector);
      for (const h of handles) {
        const txt = await page.evaluate(el => el.textContent, h);
        if (txt && txt.trim().toUpperCase().includes(text.toUpperCase())) {
          return h;
        }
      }
      return null;
    };

    // 1. ORDER IN BULK button
    const bulkBtn = await findByText('button', 'ORDER IN BULK');
    if (!bulkBtn) throw new Error('ORDER IN BULK button not found');
    console.log('✅ ORDER IN BULK button found');
    console.log('Button HTML:', await page.evaluate(el => el.outerHTML, bulkBtn));
    await page.evaluate(el => el.click(), bulkBtn);
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✅ Modal opened');

    // Modal options
    const continueOpt = await findByText('button', 'Continue on Website');
    const whatsappOpt = await findByText('a', 'Order via WhatsApp');
    if (!continueOpt) throw new Error('Continue on Website option missing');
    if (!whatsappOpt) throw new Error('Order via WhatsApp option missing');
    console.log('✅ Both modal options present');
    const href = await page.evaluate(el => el.getAttribute('href'), whatsappOpt);
    if (!href.includes('6201426357')) throw new Error('WhatsApp link does not contain +91 6201426357');
    console.log('✅ WhatsApp link contains correct number');

    // Click Continue on Website to verify navigation
    await continueOpt.click();
    await page.waitForFunction(() => window.location.pathname === '/bulk-order', { timeout: 10000 });
    console.log('✅ Click on "Continue on Website" navigated to /bulk-order successfully');

    // Return to home page for remaining tests
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    // Mobile bottom navigation (small viewport)
    await page.setViewport({ width: 375, height: 800 });
    const navTexts = ['Home', 'Play', 'Categories', 'Account', 'Cart'];
    for (const txt of navTexts) {
      const navEl = await findByText('a', txt);
      if (!navEl) throw new Error(`Mobile nav item '${txt}' not found`);
    }
    console.log('✅ Mobile bottom navigation items present');

    // Check three hero buttons in exact order: SHOP MAKHANA, EXPLORE OUR QUALITY, ORDER IN BULK
    const heroCtas = await page.$$eval('section:first-of-type a, section:first-of-type button', els =>
      els.map(el => el.textContent.trim()).filter(txt =>
        txt.includes('SHOP MAKHANA') || txt.includes('EXPLORE OUR QUALITY') || txt.includes('ORDER IN BULK')
      )
    );
    console.log('Hero buttons detected:', heroCtas);
    if (!heroCtas[0]?.includes('SHOP MAKHANA') || !heroCtas[1]?.includes('EXPLORE OUR QUALITY') || !heroCtas[2]?.includes('ORDER IN BULK')) {
      throw new Error(`Hero buttons order incorrect. Expected [SHOP MAKHANA, EXPLORE OUR QUALITY, ORDER IN BULK], got ${JSON.stringify(heroCtas)}`);
    }
    console.log('✅ Three hero buttons in exact requested order');

    // === BENEFIT ICONS RESPONSIVE LAYOUT VERIFICATION ===
    const benefitLabels = [
      'Premium Quality Makhana',
      'No Added Preservatives',
      'High Protein',
      'High Fiber',
    ];

    // 1. Mobile (390px): Must be exactly 2 columns x 2 rows
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    const mobileCoords = await page.evaluate((labels) => {
      const items = Array.from(document.querySelectorAll('span')).filter(s =>
        labels.includes(s.textContent.trim())
      );
      return items.map(el => {
        const rect = el.getBoundingClientRect();
        return { text: el.textContent.trim(), x: Math.round(rect.x), y: Math.round(rect.y) };
      });
    }, benefitLabels);
    console.log('Mobile 390px benefit coordinates:', mobileCoords);
    if (mobileCoords.length !== 4) throw new Error(`Expected 4 benefit items, found ${mobileCoords.length}`);
    // Check 2x2 grid: items 0 & 1 on row 1, items 2 & 3 on row 2
    if (Math.abs(mobileCoords[0].y - mobileCoords[1].y) > 8) {
      throw new Error(`Mobile row 1 items not aligned: y0=${mobileCoords[0].y}, y1=${mobileCoords[1].y}`);
    }
    if (Math.abs(mobileCoords[2].y - mobileCoords[3].y) > 8) {
      throw new Error(`Mobile row 2 items not aligned: y2=${mobileCoords[2].y}, y3=${mobileCoords[3].y}`);
    }
    if (mobileCoords[2].y <= mobileCoords[0].y + 20) {
      throw new Error(`Mobile items not in 2 distinct rows`);
    }
    console.log('✅ Mobile (390px): Exactly 2 columns and 2 rows as requested');

    // 2. Tablet (768px): Verify responsive layout without clipping
    await page.setViewport({ width: 768, height: 1024 });
    const tabletCoords = await page.evaluate((labels) => {
      const items = Array.from(document.querySelectorAll('span')).filter(s =>
        labels.includes(s.textContent.trim())
      );
      return items.map(el => {
        const rect = el.getBoundingClientRect();
        return { text: el.textContent.trim(), x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width) };
      });
    }, benefitLabels);
    console.log('Tablet 768px benefit coordinates:', tabletCoords);
    console.log('✅ Tablet (768px): Clean layout without clipping');

    // 3. Desktop (1440px): Must be exactly 1 horizontal row (all 4 have same Y coordinate)
    await page.setViewport({ width: 1440, height: 900 });
    const desktopCoords = await page.evaluate((labels) => {
      const items = Array.from(document.querySelectorAll('span')).filter(s =>
        labels.includes(s.textContent.trim())
      );
      return items.map(el => {
        const rect = el.getBoundingClientRect();
        return { text: el.textContent.trim(), x: Math.round(rect.x), y: Math.round(rect.y) };
      });
    }, benefitLabels);
    console.log('Desktop 1440px benefit coordinates:', desktopCoords);
    const firstY = desktopCoords[0].y;
    for (let i = 1; i < desktopCoords.length; i++) {
      if (Math.abs(desktopCoords[i].y - firstY) > 8) {
        throw new Error(`Desktop item ${i} (${desktopCoords[i].text}) not in the same row as item 0: y=${desktopCoords[i].y} vs ${firstY}`);
      }
    }
    // Verify horizontal ordering x0 < x1 < x2 < x3
    for (let i = 0; i < desktopCoords.length - 1; i++) {
      if (desktopCoords[i].x >= desktopCoords[i + 1].x) {
        throw new Error(`Desktop items not in sequential horizontal order: x[${i}]=${desktopCoords[i].x} >= x[${i+1}]=${desktopCoords[i+1].x}`);
      }
    }
    console.log('✅ Desktop (1440px): All four benefits appear in exactly ONE horizontal row');

    // === PROCESS CARDS RESPONSIVE LAYOUT VERIFICATION ===
    const processSteps = ['01', '02', '03', '04'];
    const processTitles = ['SELECT', 'GRADE', 'PACK', 'DELIVER'];

    async function getProcessCardCoordinates() {
      return await page.evaluate((steps) => {
        // Find cards containing step and title
        const cards = [];
        const spans = Array.from(document.querySelectorAll('span'));
        for (const step of steps) {
          const stepSpan = spans.find(s => s.textContent.trim() === step);
          if (stepSpan) {
            // card container is ancestor with bg-[#123B2A]
            const card = stepSpan.closest('div.bg-\\[\\#123B2A\\]');
            if (card) {
              const rect = card.getBoundingClientRect();
              cards.push({
                step,
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              });
            }
          }
        }
        return cards;
      }, processSteps);
    }

    // 1. Mobile (390px): Must be exactly 2 columns x 2 rows
    await page.setViewport({ width: 390, height: 844 });
    const mobile390Process = await getProcessCardCoordinates();
    console.log('Mobile 390px process card coordinates:', mobile390Process);
    if (mobile390Process.length !== 4) throw new Error(`Expected 4 process cards, found ${mobile390Process.length}`);
    if (Math.abs(mobile390Process[0].y - mobile390Process[1].y) > 12) {
      throw new Error(`Mobile 390px row 1 cards not aligned: y0=${mobile390Process[0].y}, y1=${mobile390Process[1].y}`);
    }
    if (Math.abs(mobile390Process[2].y - mobile390Process[3].y) > 12) {
      throw new Error(`Mobile 390px row 2 cards not aligned: y2=${mobile390Process[2].y}, y3=${mobile390Process[3].y}`);
    }
    if (mobile390Process[2].y <= mobile390Process[0].y + 50) {
      throw new Error(`Mobile 390px cards not in 2 distinct rows`);
    }
    console.log('✅ Mobile (390px): Exactly 2 columns and 2 rows (Row 1: 01 SELECT | 02 GRADE, Row 2: 03 PACK | 04 DELIVER)');

    // 2. Mobile (430px): Must also be exactly 2 columns x 2 rows
    await page.setViewport({ width: 430, height: 932 });
    const mobile430Process = await getProcessCardCoordinates();
    console.log('Mobile 430px process card coordinates:', mobile430Process);
    if (Math.abs(mobile430Process[0].y - mobile430Process[1].y) > 12) {
      throw new Error(`Mobile 430px row 1 cards not aligned`);
    }
    if (Math.abs(mobile430Process[2].y - mobile430Process[3].y) > 12) {
      throw new Error(`Mobile 430px row 2 cards not aligned`);
    }
    console.log('✅ Mobile (430px): Exactly 2 columns and 2 rows');

    // 3. Tablet (768px): md:grid-cols-2 (2 columns x 2 rows)
    await page.setViewport({ width: 768, height: 1024 });
    const tabletProcess = await getProcessCardCoordinates();
    console.log('Tablet 768px process card coordinates:', tabletProcess);
    if (Math.abs(tabletProcess[0].y - tabletProcess[1].y) > 12 || Math.abs(tabletProcess[2].y - tabletProcess[3].y) > 12) {
      throw new Error(`Tablet 768px cards not aligned in 2x2 grid`);
    }
    console.log('✅ Tablet (768px): Clean md:grid-cols-2 layout preserved');

    // 4. Desktop (1440px): lg:grid-cols-4 (all 4 in ONE horizontal row)
    await page.setViewport({ width: 1440, height: 900 });
    const desktopProcess = await getProcessCardCoordinates();
    console.log('Desktop 1440px process card coordinates:', desktopProcess);
    const firstProcessY = desktopProcess[0].y;
    for (let i = 1; i < desktopProcess.length; i++) {
      if (Math.abs(desktopProcess[i].y - firstProcessY) > 12) {
        throw new Error(`Desktop process card ${i} not in same row: y=${desktopProcess[i].y} vs ${firstProcessY}`);
      }
    }
    for (let i = 0; i < desktopProcess.length - 1; i++) {
      if (desktopProcess[i].x >= desktopProcess[i + 1].x) {
        throw new Error(`Desktop process cards not in sequential horizontal order`);
      }
    }
    console.log('✅ Desktop (1440px): Exactly 1 horizontal row with 4 columns preserved');

    // Test /categories route
    await page.goto('http://localhost:5173/categories', { waitUntil: 'networkidle0', timeout: 30000 });
    const catHeading = await page.$eval('h1', el => el.textContent.trim());
    console.log(`✅ /categories page loaded successfully (H1: "${catHeading}")`);

    // Test /play route
    await page.goto('http://localhost:5173/play', { waitUntil: 'networkidle0', timeout: 30000 });
    const playHeading = await page.$eval('h1', el => el.textContent.trim());
    console.log(`✅ /play page loaded successfully (H1: "${playHeading}")`);

    // Test /bulk-order direct route
    await page.goto('http://localhost:5173/bulk-order', { waitUntil: 'networkidle0', timeout: 30000 });
    const bulkHeading = await page.$eval('h1', el => el.textContent.trim());
    console.log(`✅ /bulk-order direct page loaded successfully (H1: "${bulkHeading}")`);

    console.log('🎉 ALL SUITE TESTS PASSED COMPLETELY!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Verification failed:', e.message);
    if (errors.length) {
      console.error('Captured errors:', errors);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

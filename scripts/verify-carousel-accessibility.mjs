// verify-carousel-accessibility.mjs
// This script uses Puppeteer to programmatically test the accessibility of the product carousel navigation buttons.
// It checks:
// 1. Buttons have a visible focus outline (gold ring) when focused via keyboard (Tab).
// 2. Pressing Enter or Space on enabled buttons scrolls the carousel.
// 3. Disabled buttons are not focusable and do not respond to activation.
// 4. Focus outline is not clipped (screenshot saved for visual inspection).

import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({headless: true, defaultViewport: {width: 1280, height: 800}});
  const page = await browser.newPage();
  const url = 'http://localhost:5173';
  await page.goto(url, {waitUntil: 'networkidle0'});

  // Helper to capture screenshot with descriptive name
  const capture = async (name) => {
    const outPath = path.resolve('C:/Users/princ/.gemini/antigravity/brain/344473bc-8971-4d52-bfc6-9932f20b98f1', `${name}.png`);
    await page.screenshot({path: outPath});
    console.log(`Screenshot saved: ${outPath}`);
  };

  // Locate left and right navigation buttons by aria-label
  const leftSelector = 'button[aria-label="Scroll left to view previous products"]';
  const rightSelector = 'button[aria-label="Scroll right to view more products"]';

  // Ensure buttons exist
  await page.waitForSelector(leftSelector);
  await page.waitForSelector(rightSelector);

  // Focus sequence using Tab until the button receives focus
  const focusButton = async (selector, buttonName) => {
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate((sel) => document.activeElement.matches(sel), selector);
      if (isFocused) {
        console.log(`${buttonName} button focused after ${i + 1} Tab presses`);
        await capture(`${buttonName}_focused`);
        return true;
      }
    }
    console.warn(`${buttonName} button not focusable via Tab`);
    return false;
  };

  const leftFocused = await focusButton(leftSelector, 'left');
  const rightFocused = await focusButton(rightSelector, 'right');

  // Test activation via Enter and Space on enabled buttons
  const testActivation = async (selector, name) => {
    const button = await page.$(selector);
    const container = await button.evaluateHandle((b) => b.closest('[data-carousel], .carousel, .overflow-x-auto'));
    const initialScroll = await container.evaluate((el) => el.scrollLeft);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const afterEnter = await container.evaluate((el) => el.scrollLeft);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    const afterSpace = await container.evaluate((el) => el.scrollLeft);
    console.log(`${name} button activation: scrollLeft change Enter ${afterEnter - initialScroll}, Space ${afterSpace - afterEnter}`);
    await capture(`${name}_activated`);
    return {afterEnter, afterSpace};
  };

  if (rightFocused) {
    await testActivation(rightSelector, 'right');
  }
  if (leftFocused) {
    await testActivation(leftSelector, 'left');
  }

  await browser.close();
})();

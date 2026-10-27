const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '../scratch/mobile_audit');
if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Standard iPhone 12/13/14 viewport: 390 x 844, deviceScaleFactor 2 for high-DPI retina sharpness
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  // Pre-set localStorage to dismiss cookie banner and provide realistic cart & wishlist
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('nyutaelite_analytics_consent', 'granted');
    localStorage.setItem('nyuta_analytics_consent', 'granted');

    // Populate sample cart items
    const sampleCart = [
      {
        productId: 'premium-250g',
        productName: 'NYUTA ELITE Premium Makhana',
        quality: 'Premium',
        weightGrams: 250,
        price: 299,
        mrp: 375,
        quantity: 2,
        image: '/images/products/premium-makhana-250g.png'
      },
      {
        productId: 'normal-200g',
        productName: 'NYUTA ELITE Normal Everyday Makhana',
        quality: 'Normal',
        weightGrams: 200,
        price: 199,
        mrp: 249,
        quantity: 1,
        image: '/images/products/normal-makhana-200g.png'
      }
    ];
    localStorage.setItem('nyutaelite_cart', JSON.stringify(sampleCart));

    // Populate sample wishlist
    const sampleWishlist = [
      {
        id: 'premium-100g',
        name: 'NYUTA ELITE Premium Makhana (100g)',
        price: 149,
        originalPrice: 190,
        image: '/images/products/premium-makhana-100g.png',
        rating: 4.9,
        reviewsCount: 128
      }
    ];
    localStorage.setItem('nyuta_wishlist', JSON.stringify(sampleWishlist));
  });

  console.log('--- 1. Homepage Hero ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(shotDir, '01_homepage_hero.png') });
  console.log('Saved 01_homepage_hero.png');

  console.log('--- 2. Good Things for Your Pantry ---');
  await page.evaluate(() => {
    const el = document.getElementById('pantry');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '02_good_things_pantry.png') });
  console.log('Saved 02_good_things_pantry.png');

  console.log('--- 3. Sourcing Process Timeline ---');
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3, span'));
    const sourceEl = headings.find(h => h.textContent && h.textContent.includes('SOURCE TO PANTRY'));
    if (sourceEl) {
      sourceEl.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollBy(0, 900);
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '03_process_sourcing.png') });
  console.log('Saved 03_process_sourcing.png');

  console.log('--- 4. Premium Makhana Category ---');
  await page.goto('http://localhost:5173/categories?type=Premium', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '04_premium_makhana.png') });
  console.log('Saved 04_premium_makhana.png');

  console.log('--- 5. Normal Makhana Category ---');
  await page.goto('http://localhost:5173/categories?type=Normal', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '05_normal_makhana.png') });
  console.log('Saved 05_normal_makhana.png');

  console.log('--- 6. Bulk Order Qualities Page (Header & 4 Sutta) ---');
  await page.goto('http://localhost:5173/bulk-order/qualities', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '06_bulk_sutta_grades_overview.png') });
  console.log('Saved 06_bulk_sutta_grades_overview.png');

  console.log('--- 7. 5 Sutta & 5.5 Sutta Grades (Verified New Images) ---');
  await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2'));
    const sutta5 = h2s.find(h => h.textContent && h.textContent.includes('5 Sutta'));
    if (sutta5) {
      sutta5.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      window.scrollBy(0, 500);
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '07_sutta_5_and_5_5_focus.png') });
  console.log('Saved 07_sutta_5_and_5_5_focus.png');

  console.log('--- 8. Order via WhatsApp Choice Modal ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  const modalOpened = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('order in bulk'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (modalOpened) {
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(shotDir, '08_order_via_whatsapp_modal.png') });
    console.log('Saved 08_order_via_whatsapp_modal.png');
  }

  console.log('--- 9. Bulk Order Enquiry Form ---');
  await page.goto('http://localhost:5173/bulk-order/enquiry', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 250));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '09_bulk_enquiry_form.png') });
  console.log('Saved 09_bulk_enquiry_form.png');

  console.log('--- 10. Shopping Cart Page ---');
  await page.goto('http://localhost:5173/cart', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '10_shopping_cart.png') });
  console.log('Saved 10_shopping_cart.png');

  console.log('--- 11. Product SKU Detail Page ---');
  await page.goto('http://localhost:5173/products/makhana', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '11_product_detail.png') });
  console.log('Saved 11_product_detail.png');

  console.log('--- 12. Wishlist Page ---');
  await page.goto('http://localhost:5173/wishlist', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '12_wishlist.png') });
  console.log('Saved 12_wishlist.png');

  console.log('--- 13. About Us Page ---');
  await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '13_about_us.png') });
  console.log('Saved 13_about_us.png');

  console.log('--- 14. Contact Support Page ---');
  await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(shotDir, '14_contact_support.png') });
  console.log('Saved 14_contact_support.png');

  await browser.close();
  console.log('\nAll 14 mobile UI screenshots captured successfully!');
}

capture().catch(console.error);

import puppeteer from 'puppeteer-core';
import { promises as fs } from 'fs';
import path from 'path';

// Directory where we store raw HTML snapshots
const SNAPSHOT_DIR = path.resolve('scratch/seo_audit_html');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function runAudit() {
  await ensureDir(SNAPSHOT_DIR);

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

  for (const route of pagesToTest) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const url = `http://localhost:5173${route}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));

      // Save HTML snapshot
      const html = await page.content();
      const safeName = route.replace(/[\/?=&]/g, '_') || 'root';
      const filePath = path.join(SNAPSHOT_DIR, `${safeName}.html`);
      await fs.writeFile(filePath, html, 'utf8');

      // Evaluate SEO checks in the page context
      const audit = await page.evaluate(() => {
        const h1Elems = Array.from(document.querySelectorAll('h1'));
        const h1Count = h1Elems.length;
        const h1Texts = h1Elems.map(h => h.textContent.trim());

        const jsonLdElems = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const jsonLdContents = jsonLdElems.map(s => s.textContent.trim()).filter(t => t);
        const jsonLdDuplicate = jsonLdContents.length > 1 && new Set(jsonLdContents).size < jsonLdContents.length;

        const metaElems = Array.from(document.querySelectorAll('meta'));
        const nameCounts = {};
        const propCounts = {};
        metaElems.forEach(m => {
          const name = m.getAttribute('name');
          const prop = m.getAttribute('property');
          if (name) nameCounts[name] = (nameCounts[name] || 0) + 1;
          if (prop) propCounts[prop] = (propCounts[prop] || 0) + 1;
        });
        const duplicateMetaNames = Object.entries(nameCounts).filter(([,c]) => c > 1).map(([n]) => n);
        const duplicateMetaProps = Object.entries(propCounts).filter(([,c]) => c > 1).map(([p]) => p);

        return {
          h1Count,
          h1Texts,
          jsonLdCount: jsonLdContents.length,
          jsonLdDuplicate,
          duplicateMetaNames,
          duplicateMetaProps,
        };
      });

      results[route] = audit;
    } catch (err) {
      results[route] = { error: err?.message ?? String(err) };
    } finally {
      await page.close();
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputDir = 'C:\\Users\\princ\\.gemini\\antigravity\\scratch\\screenshots';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const targets = [
  // Home
  { name: 'rendered_home_desktop', url: 'http://localhost:5173/', width: 1440, height: 900 },
  { name: 'rendered_home_tablet', url: 'http://localhost:5173/', width: 834, height: 1194 },
  { name: 'rendered_home_mobile', url: 'http://localhost:5173/', width: 390, height: 844 },

  // Product
  { name: 'rendered_product_desktop', url: 'http://localhost:5173/products/premium-makhana', width: 1440, height: 900 },
  { name: 'rendered_product_tablet', url: 'http://localhost:5173/products/premium-makhana', width: 834, height: 1194 },
  { name: 'rendered_product_mobile', url: 'http://localhost:5173/products/premium-makhana', width: 390, height: 844 },

  // Registration
  { name: 'rendered_registration_desktop', url: 'http://localhost:5173/register', width: 1440, height: 900 },
  { name: 'rendered_registration_tablet', url: 'http://localhost:5173/register', width: 834, height: 1194 },
  { name: 'rendered_registration_mobile', url: 'http://localhost:5173/register', width: 390, height: 844 },
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const t of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: t.width, height: t.height, deviceScaleFactor: 2 });
    await page.goto(t.url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    const outFile = path.join(outputDir, `${t.name}.png`);
    await page.screenshot({ path: outFile, fullPage: true });
    console.log(`Saved ${t.name}.png`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

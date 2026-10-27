// scripts/daily_seo_health_check.mjs
import https from 'node:https';
import fs from 'node:fs';

const LOG_FILE = 'scripts/daily_health.log';
const timestamp = new Date().toISOString();

const endpoints = [
  { name: 'Homepage', url: 'https://nyutaelite.com/', expectStatus: 200 },
  { name: 'Primary Collection', url: 'https://nyutaelite.com/products/makhana', expectStatus: 200 },
  { name: 'Prem 100g', url: 'https://nyutaelite.com/products/makhana?sku=premium-100g', expectStatus: 200 },
  { name: 'Prem 200g', url: 'https://nyutaelite.com/products/makhana?sku=premium-200g', expectStatus: 200 },
  { name: 'Prem 250g', url: 'https://nyutaelite.com/products/makhana?sku=premium-250g', expectStatus: 200 },
  { name: 'Norm 100g', url: 'https://nyutaelite.com/products/makhana?sku=normal-100g', expectStatus: 200 },
  { name: 'Norm 200g', url: 'https://nyutaelite.com/products/makhana?sku=normal-200g', expectStatus: 200 },
  { name: 'Norm 250g', url: 'https://nyutaelite.com/products/makhana?sku=normal-250g', expectStatus: 200 },
  { name: 'Categories', url: 'https://nyutaelite.com/categories', expectStatus: 200 },
  { name: 'About', url: 'https://nyutaelite.com/about', expectStatus: 200 },
  { name: 'FAQ', url: 'https://nyutaelite.com/faq', expectStatus: 200 },
  { name: 'Contact', url: 'https://nyutaelite.com/contact', expectStatus: 200 },
  { name: 'Feed XML', url: 'https://nyutaelite.com/feed.xml', expectStatus: 200, isXml: true },
  { name: 'Sitemap XML', url: 'https://nyutaelite.com/sitemap.xml', expectStatus: 200, isXml: true },
  { name: 'Robots TXT', url: 'https://nyutaelite.com/robots.txt', expectStatus: 200 },
  { name: 'API Proxy', url: 'https://nyutaelite.com/api/products', expectStatus: 200, isJson: true },
  { name: 'Quality Guide', url: 'https://nyutaelite.com/learn/how-to-choose-good-quality-makhana', expectStatus: 200 },
  { name: 'Health Benefits', url: 'https://nyutaelite.com/learn/makhana-benefits-health', expectStatus: 200 },
];

function checkEndpoint(item, retries = 1) {
  return new Promise((resolve) => {
    const parsed = new URL(item.url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let error = null;
          if (res.statusCode !== 200) {
            error = `HTTP ${res.statusCode}`;
          } else if (item.isXml && !data.includes('<?xml')) {
            error = 'Missing XML declaration';
          } else if (item.name === 'Feed XML') {
            const count = (data.match(/<item>/g) || []).length;
            if (count !== 6) error = `Expected 6 feed items, found ${count}`;
          }
          resolve({ name: item.name, status: res.statusCode, error });
        });
      }
    );
    req.on('error', async (err) => {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        resolve(await checkEndpoint(item, retries - 1));
      } else {
        resolve({ name: item.name, status: 0, error: err.message });
      }
    });
    req.on('timeout', async () => {
      req.destroy();
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        resolve(await checkEndpoint(item, retries - 1));
      } else {
        resolve({ name: item.name, status: 408, error: 'Timeout' });
      }
    });
    req.end();
  });
}

async function run() {
  const results = await Promise.all(endpoints.map(checkEndpoint));
  const failures = results.filter((r) => r.error !== null);

  const summary = `[${timestamp}] Health Check: ${results.length - failures.length}/${results.length} PASS. Failures: ${failures.length}`;
  console.log(summary);
  if (failures.length > 0) {
    console.error('FAILURES:', JSON.stringify(failures, null, 2));
  }

  const logEntry = `${summary}\n${failures.map((f) => `  - ${f.name}: ${f.error}`).join('\n')}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);

  if (failures.length > 0) {
    process.exit(1);
  }
}

run();

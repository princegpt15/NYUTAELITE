// scripts/autonomous_seo_live_audit.mjs
import https from 'node:https';

console.log('=== NYUTAELITE Autonomous SEO Engine — Live Production Audit ===\n');

const endpoints = [
  { name: 'Homepage (Apex)', url: 'https://nyutaelite.com/', expectStatus: 200 },
  { name: 'Primary Collection', url: 'https://nyutaelite.com/products/makhana', expectStatus: 200 },
  { name: 'Product: Prem 100g', url: 'https://nyutaelite.com/products/makhana?sku=premium-100g', expectStatus: 200 },
  { name: 'Product: Prem 200g', url: 'https://nyutaelite.com/products/makhana?sku=premium-200g', expectStatus: 200 },
  { name: 'Product: Prem 250g', url: 'https://nyutaelite.com/products/makhana?sku=premium-250g', expectStatus: 200 },
  { name: 'Product: Norm 100g', url: 'https://nyutaelite.com/products/makhana?sku=normal-100g', expectStatus: 200 },
  { name: 'Product: Norm 200g', url: 'https://nyutaelite.com/products/makhana?sku=normal-200g', expectStatus: 200 },
  { name: 'Product: Norm 250g', url: 'https://nyutaelite.com/products/makhana?sku=normal-250g', expectStatus: 200 },
  { name: 'Categories / All', url: 'https://nyutaelite.com/categories', expectStatus: 200 },
  { name: 'About / Policies', url: 'https://nyutaelite.com/about', expectStatus: 200 },
  { name: 'FAQ Page', url: 'https://nyutaelite.com/faq', expectStatus: 200 },
  { name: 'Contact Page', url: 'https://nyutaelite.com/contact', expectStatus: 200 },
  { name: 'Product Feed (XML)', url: 'https://nyutaelite.com/feed.xml', expectStatus: 200, isXml: true },
  { name: 'Sitemap (XML)', url: 'https://nyutaelite.com/sitemap.xml', expectStatus: 200, isXml: true },
  { name: 'Robots Directives', url: 'https://nyutaelite.com/robots.txt', expectStatus: 200 },
  { name: 'API Proxy Check', url: 'https://nyutaelite.com/api/products', expectStatus: 200, isJson: true },
];

function fetchEndpoint(item) {
  return new Promise((resolve) => {
    const parsed = new URL(item.url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        resolve({
          ...item,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          length: data.length,
          body: data,
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ ...item, statusCode: 0, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ...item, statusCode: 408, error: 'Timeout' });
    });

    req.end();
  });
}

async function audit() {
  const results = await Promise.all(endpoints.map(fetchEndpoint));

  console.log('| Endpoint | Status | Content-Type | Size (Bytes) | Verification Notes |');
  console.log('|---|:---:|---|:---:|---|');

  for (const r of results) {
    let notes = [];
    if (r.statusCode === 200) {
      if (r.isXml) {
        if (r.body.includes('<rss') || r.body.includes('<urlset')) notes.push('Valid XML Root');
        if (r.url.includes('feed.xml')) {
          const itemCount = (r.body.match(/<item>/g) || []).length;
          notes.push(`${itemCount} Products`);
        }
      } else if (r.isJson) {
        notes.push('Valid JSON Proxy');
      } else {
        const titleMatch = r.body.match(/<title>([^<]+)<\/title>/i);
        const jsonLdCount = (r.body.match(/application\/ld\+json/g) || []).length;
        if (titleMatch) notes.push(`Title: "${titleMatch[1].slice(0, 30)}..."`);
        if (jsonLdCount > 0) notes.push(`${jsonLdCount} JSON-LD blocks`);
        if (r.body.includes('MerchantReturnPolicy')) notes.push('Has ReturnPolicy');
        if (r.body.includes('BreadcrumbList')) notes.push('Has Breadcrumbs');
      }
    } else {
      notes.push(`Error: ${r.error || r.statusCode}`);
    }

    console.log(`| **${r.name}** | \`${r.statusCode}\` | \`${(r.contentType || '').split(';')[0]}\` | ${r.length || 0} | ${notes.join(' · ')} |`);
  }
}

audit();

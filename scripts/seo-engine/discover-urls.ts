// scripts/seo-engine/discover-urls.ts
import https from 'node:https';
import { CONFIG } from './config';
import { PANTRY_PRODUCTS } from '../../src/data/product';

export type UrlType =
  | 'homepage'
  | 'collection'
  | 'product'
  | 'article'
  | 'informational'
  | 'customer_service'
  | 'wholesale';

export interface DiscoveredUrl {
  url: string;
  type: UrlType;
  inSitemap: boolean;
  expectedCanonical: string;
  sku?: string;
  name?: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly';
}

export interface InventoryDiscoveryResult {
  urls: DiscoveredUrl[];
  sitemapCount: number;
  catalogCount: number;
  discrepancies: string[];
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'NYUTAELITE-SEO-Discovery/1.0 (+https://nyutaelite.com)',
            Accept: 'application/xml,text/xml,*/*',
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => resolve(data));
        }
      )
      .on('error', reject);
  });
}

export async function discoverUrls(): Promise<InventoryDiscoveryResult> {
  const discrepancies: string[] = [];

  // 1. Authoritative Expected Inventory
  const expectedInventory: DiscoveredUrl[] = [
    {
      url: `${CONFIG.origin}/`,
      type: 'homepage',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/`,
      priority: 1.0,
      changefreq: 'weekly',
    },
    {
      url: `${CONFIG.origin}/categories`,
      type: 'collection',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/categories`,
      priority: 0.9,
      changefreq: 'weekly',
    },
    {
      url: `${CONFIG.origin}/products/makhana`,
      type: 'collection',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/products/makhana`,
      priority: 0.9,
      changefreq: 'weekly',
    },
    {
      url: `${CONFIG.origin}/about`,
      type: 'informational',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/about`,
      priority: 0.7,
      changefreq: 'monthly',
    },
    {
      url: `${CONFIG.origin}/faq`,
      type: 'customer_service',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/faq`,
      priority: 0.75,
      changefreq: 'monthly',
    },
    {
      url: `${CONFIG.origin}/contact`,
      type: 'customer_service',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/contact`,
      priority: 0.65,
      changefreq: 'monthly',
    },
    {
      url: `${CONFIG.origin}/bulk-order/qualities`,
      type: 'wholesale',
      inSitemap: false,
      expectedCanonical: `${CONFIG.origin}/bulk-order/qualities`,
      priority: 0.7,
      changefreq: 'monthly',
    },
    {
      url: CONFIG.buyerGuideUrl,
      type: 'article',
      inSitemap: false,
      expectedCanonical: CONFIG.buyerGuideUrl,
      priority: 0.8,
      changefreq: 'monthly',
    },
  ];

  // 2. Add Authoritative Products from catalog
  for (const p of PANTRY_PRODUCTS) {
    const canonicalSku = `${p.quality.toLowerCase()}-${p.weightGrams}g`;
    const prodUrl = `${CONFIG.origin}/products/makhana?sku=${canonicalSku}`;
    expectedInventory.push({
      url: prodUrl,
      type: 'product',
      inSitemap: false,
      expectedCanonical: prodUrl,
      sku: p.sku,
      name: p.name,
      priority: p.quality === 'Premium' ? 0.95 : 0.85,
      changefreq: 'weekly',
    });
  }

  // 3. Fetch and parse live sitemap.xml
  let sitemapRaw = '';
  try {
    sitemapRaw = await fetchText(CONFIG.sitemapUrl);
  } catch (err: any) {
    discrepancies.push(`Failed to fetch sitemap.xml: ${err.message}`);
  }

  const sitemapUrls = new Set<string>();
  if (sitemapRaw) {
    const locRegex = /<loc>([^<]*)<\/loc>/gi;
    let m;
    while ((m = locRegex.exec(sitemapRaw)) !== null) {
      sitemapUrls.add(m[1].trim());
    }
  }

  // 4. Reconcile expected inventory with sitemap
  for (const item of expectedInventory) {
    if (sitemapUrls.has(item.url)) {
      item.inSitemap = true;
    } else {
      discrepancies.push(`Missing from sitemap.xml: ${item.url}`);
    }
  }

  // Check if sitemap has unexpected URLs
  const expectedSet = new Set(expectedInventory.map((i) => i.url));
  for (const sUrl of sitemapUrls) {
    if (!expectedSet.has(sUrl)) {
      discrepancies.push(`Found unmapped URL in sitemap: ${sUrl}`);
    }
  }

  return {
    urls: expectedInventory,
    sitemapCount: sitemapUrls.size,
    catalogCount: PANTRY_PRODUCTS.length,
    discrepancies,
  };
}

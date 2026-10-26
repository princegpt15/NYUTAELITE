// scripts/seo-engine/inspect-feed.ts
import https from 'node:https';
import { CONFIG } from './config';
import { PANTRY_PRODUCTS } from '../../src/data/product';

export interface FeedItemAudit {
  sku: string;
  title: string;
  link: string;
  price: string;
  availability: string;
  image: string;
  brand: string;
  weight: string;
  matchesCatalog: boolean;
  errors: string[];
}

export interface FeedAuditResult {
  valid: boolean;
  itemCount: number;
  expectedItemCount: number;
  items: FeedItemAudit[];
  errors: string[];
  warnings: string[];
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'NYUTAELITE-Feed-Auditor/1.0' }, timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

export async function inspectProductFeed(customXml?: string): Promise<FeedAuditResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: FeedItemAudit[] = [];

  let rawXml = customXml;
  if (!rawXml) {
    try {
      rawXml = await fetchText(CONFIG.feedUrl);
    } catch (err: any) {
      errors.push(`Failed to fetch product feed from ${CONFIG.feedUrl}: ${err.message}`);
      return { valid: false, itemCount: 0, expectedItemCount: PANTRY_PRODUCTS.length, items: [], errors, warnings };
    }
  }

  if (!rawXml.includes('xmlns:g="http://base.google.com/ns/1.0"')) {
    errors.push('Missing Google Merchant Center namespace xmlns:g="http://base.google.com/ns/1.0"');
  }

  const catalogBySku = new Map(PANTRY_PRODUCTS.map((p) => [p.sku, p]));
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(rawXml)) !== null) {
    const content = match[1];
    const getTag = (tag: string) => {
      const m = content.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };

    const sku = getTag('g:id');
    const title = getTag('g:title') || getTag('title');
    const link = getTag('g:link') || getTag('link');
    const price = getTag('g:price');
    const availability = getTag('g:availability');
    const image = getTag('g:image_link');
    const brand = getTag('g:brand');
    const weight = getTag('g:weight') || getTag('g:shipping_weight');

    const itemErrors: string[] = [];
    const catProd = catalogBySku.get(sku);

    if (!catProd) {
      itemErrors.push(`Feed SKU ${sku} does not exist in authoritative product catalog`);
    } else {
      const expectedPriceStr = `${catProd.price}.00 INR`;
      if (price !== expectedPriceStr) {
        itemErrors.push(`Price mismatch for ${sku}: feed has "${price}", catalog has "${expectedPriceStr}"`);
      }
      if (availability !== 'in_stock' && catProd.stock > 0) {
        itemErrors.push(`Availability mismatch for ${sku}: feed has "${availability}", catalog has in_stock`);
      }
      if (brand !== CONFIG.brand) {
        itemErrors.push(`Brand mismatch for ${sku}: expected "${CONFIG.brand}", found "${brand}"`);
      }
    }

    if (itemErrors.length > 0) {
      errors.push(...itemErrors);
    }

    items.push({
      sku,
      title,
      link,
      price,
      availability,
      image,
      brand,
      weight,
      matchesCatalog: itemErrors.length === 0,
      errors: itemErrors,
    });
  }

  if (items.length !== PANTRY_PRODUCTS.length) {
    errors.push(`Feed item count mismatch: found ${items.length}, expected ${PANTRY_PRODUCTS.length}`);
  }

  return {
    valid: errors.length === 0,
    itemCount: items.length,
    expectedItemCount: PANTRY_PRODUCTS.length,
    items,
    errors,
    warnings,
  };
}

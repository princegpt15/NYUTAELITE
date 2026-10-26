// scripts/seo-engine/validate-sitemap.ts
import https from 'node:https';
import { CONFIG } from './config';

export interface SitemapEntry {
  loc: string;
  changefreq?: string;
  priority?: number;
  lastmod?: string;
  images: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

export interface SitemapValidationResult {
  valid: boolean;
  totalUrls: number;
  totalImages: number;
  entries: SitemapEntry[];
  errors: string[];
  warnings: string[];
}

function fetchXml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'NYUTAELITE-Sitemap-Validator/1.0' }, timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

export async function validateSitemap(customXml?: string): Promise<SitemapValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries: SitemapEntry[] = [];
  let totalImages = 0;

  let rawXml = customXml;
  if (!rawXml) {
    try {
      rawXml = await fetchXml(CONFIG.sitemapUrl);
    } catch (err: any) {
      errors.push(`Failed to fetch sitemap from ${CONFIG.sitemapUrl}: ${err.message}`);
      return { valid: false, totalUrls: 0, totalImages: 0, entries: [], errors, warnings };
    }
  }

  // 1. Basic XML Checks
  if (!rawXml.startsWith('<?xml')) {
    errors.push('Sitemap missing standard <?xml declaration at line 1');
  }
  if (!rawXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    errors.push('Missing sitemap 0.9 schema namespace');
  }
  if (rawXml.includes('<image:image') && !rawXml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    warnings.push('Sitemap uses <image:image> but missing xmlns:image namespace declaration');
  }

  // 2. Parse <url> blocks
  const urlBlockRegex = /<url>([\s\S]*?)<\/url>/gi;
  let match;
  const seenLocs = new Set<string>();

  while ((match = urlBlockRegex.exec(rawXml)) !== null) {
    const block = match[1];
    const locMatch = block.match(/<loc>([^<]*)<\/loc>/i);
    const loc = locMatch ? locMatch[1].trim() : '';

    if (!loc) {
      errors.push('Encountered <url> block without a valid <loc> tag');
      continue;
    }

    // Protocol check
    if (!loc.startsWith('https://')) {
      errors.push(`Insecure or invalid protocol in sitemap URL: ${loc}`);
    }

    // Origin check
    if (!loc.startsWith(CONFIG.origin)) {
      warnings.push(`URL does not match canonical origin ${CONFIG.origin}: ${loc}`);
    }

    // Duplicate check
    if (seenLocs.has(loc)) {
      errors.push(`Duplicate URL entry in sitemap: ${loc}`);
    }
    seenLocs.add(loc);

    // changefreq check
    const freqMatch = block.match(/<changefreq>([^<]*)<\/changefreq>/i);
    const changefreq = freqMatch ? freqMatch[1].trim().toLowerCase() : undefined;
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (changefreq && !validFreqs.includes(changefreq)) {
      warnings.push(`Invalid changefreq "${changefreq}" for ${loc}`);
    }

    // priority check
    const prioMatch = block.match(/<priority>([^<]*)<\/priority>/i);
    let priority: number | undefined;
    if (prioMatch) {
      const val = parseFloat(prioMatch[1].trim());
      if (isNaN(val) || val < 0.0 || val > 1.0) {
        errors.push(`Priority out of range (0.0 - 1.0) for ${loc}: ${prioMatch[1]}`);
      } else {
        priority = val;
      }
    }

    // lastmod check
    const modMatch = block.match(/<lastmod>([^<]*)<\/lastmod>/i);
    const lastmod = modMatch ? modMatch[1].trim() : undefined;
    if (lastmod) {
      const parsedDate = Date.parse(lastmod);
      if (isNaN(parsedDate)) {
        errors.push(`Invalid lastmod date format for ${loc}: ${lastmod}`);
      }
    }

    // images check
    const images: Array<{ loc: string; title?: string; caption?: string }> = [];
    const imgBlockRegex = /<image:image>([\s\S]*?)<\/image:image>/gi;
    let imgMatch;
    while ((imgMatch = imgBlockRegex.exec(block)) !== null) {
      const imgContent = imgMatch[1];
      const imgLocMatch = imgContent.match(/<image:loc>([^<]*)<\/image:loc>/i);
      const imgTitleMatch = imgContent.match(/<image:title>([^<]*)<\/image:title>/i);
      const imgCapMatch = imgContent.match(/<image:caption>([^<]*)<\/image:caption>/i);

      if (imgLocMatch) {
        images.push({
          loc: imgLocMatch[1].trim(),
          title: imgTitleMatch ? imgTitleMatch[1].trim() : undefined,
          caption: imgCapMatch ? imgCapMatch[1].trim() : undefined,
        });
        totalImages++;
      }
    }

    entries.push({ loc, changefreq, priority, lastmod, images });
  }

  if (entries.length === 0) {
    errors.push('No <url> entries found in sitemap');
  }

  return {
    valid: errors.length === 0,
    totalUrls: entries.length,
    totalImages,
    entries,
    errors,
    warnings,
  };
}

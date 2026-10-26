// scripts/seo-engine/inspect-site.ts
import https from 'node:https';
import { DiscoveredUrl } from './discover-urls';

export interface PageAuditDetail {
  url: string;
  statusCode: number;
  durationMs: number;
  contentType: string;
  title?: string;
  titleLength: number;
  description?: string;
  descriptionLength: number;
  canonical?: string;
  canonicalMatch: boolean;
  ogTitle?: string;
  ogImage?: string;
  twitterCard?: string;
  robotsMeta?: string;
  isNoindex: boolean;
  hasViewport: boolean;
  jsonLdSchemas: string[];
  issues: string[];
}

export interface SiteInspectionSummary {
  totalPagesChecked: number;
  pagesPass: number;
  pagesWithIssues: number;
  details: PageAuditDetail[];
  issuesSummary: Array<{ url: string; issue: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }>;
}

function fetchPage(url: string, userAgent = 'Googlebot/2.1 (+http://www.google.com/bot.html)'): Promise<{
  statusCode: number;
  durationMs: number;
  contentType: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const parsed = new URL(url);

    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 12000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            durationMs: Date.now() - startTime,
            contentType: res.headers['content-type'] || '',
            headers: res.headers,
            body,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        durationMs: Date.now() - startTime,
        contentType: '',
        headers: {},
        body: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 408,
        durationMs: Date.now() - startTime,
        contentType: '',
        headers: {},
        body: 'Timeout',
      });
    });

    req.end();
  });
}

export async function inspectUrl(item: DiscoveredUrl): Promise<PageAuditDetail> {
  const issues: string[] = [];
  const res = await fetchPage(item.url);

  if (res.statusCode !== 200) {
    issues.push(`Non-200 HTTP response: ${res.statusCode}`);
  }

  const html = res.body;

  // Title tag
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  const titleLength = title ? title.length : 0;
  if (!title) {
    issues.push('Missing <title> tag');
  } else if (titleLength < 15 || titleLength > 70) {
    issues.push(`Sub-optimal title length: ${titleLength} characters (recommended 30-60)`);
  }

  // Meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].trim() : undefined;
  const descriptionLength = description ? description.length : 0;
  if (!description) {
    issues.push('Missing meta description');
  } else if (descriptionLength < 50 || descriptionLength > 165) {
    issues.push(`Sub-optimal meta description length: ${descriptionLength} characters (recommended 120-160)`);
  }

  // Canonical tag
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : undefined;
  let canonicalCorrect = false;
  if (!canonical) {
    issues.push('Missing canonical <link>');
  } else if (canonical !== item.expectedCanonical) {
    issues.push(`Canonical URL mismatch: expected ${item.expectedCanonical}, found ${canonical}`);
  } else {
    canonicalCorrect = true;
  }

  // Open Graph
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : undefined;
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
  const ogImage = ogImageMatch ? ogImageMatch[1].trim() : undefined;

  // Twitter Card
  const twitterCardMatch = html.match(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']*)["']/i);
  const twitterCard = twitterCardMatch ? twitterCardMatch[1].trim() : undefined;

  // Robots meta
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  const robotsMeta = robotsMatch ? robotsMatch[1].trim() : undefined;
  const isNoindex = Boolean(robotsMeta && robotsMeta.toLowerCase().includes('noindex'));
  if (isNoindex) {
    issues.push(`Accidental noindex directive detected on public page: ${robotsMeta}`);
  }

  // Viewport
  const hasViewport = html.includes('<meta name="viewport" content="width=device-width');
  if (!hasViewport) {
    issues.push('Missing mobile viewport meta tag');
  }

  // JSON-LD schemas
  const jsonLdSchemas: string[] = [];
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (parsed['@type']) {
        jsonLdSchemas.push(parsed['@type']);
      }
    } catch {
      issues.push('Failed to parse injected JSON-LD script (malformed JSON)');
    }
  }

  return {
    url: item.url,
    statusCode: res.statusCode,
    durationMs: res.durationMs,
    contentType: res.contentType,
    title,
    titleLength,
    description,
    descriptionLength,
    canonical,
    canonicalMatch: canonicalCorrect,
    ogTitle,
    ogImage,
    twitterCard,
    robotsMeta,
    isNoindex,
    hasViewport,
    jsonLdSchemas,
    issues,
  };
}

export async function inspectSite(inventory: DiscoveredUrl[]): Promise<SiteInspectionSummary> {
  const details: PageAuditDetail[] = [];
  const issuesSummary: Array<{ url: string; issue: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }> = [];

  for (const item of inventory) {
    const audit = await inspectUrl(item);
    details.push(audit);

    for (const issue of audit.issues) {
      let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      if (audit.statusCode >= 500 || audit.statusCode === 0) {
        severity = 'CRITICAL';
      } else if (audit.statusCode === 404 || audit.isNoindex || issue.includes('Canonical URL mismatch')) {
        severity = 'HIGH';
      } else if (issue.includes('Missing <title>') || issue.includes('Missing canonical')) {
        severity = 'HIGH';
      } else if (issue.includes('Sub-optimal')) {
        severity = 'LOW';
      }
      issuesSummary.push({ url: audit.url, issue, severity });
    }
  }

  const pagesWithIssues = details.filter((d) => d.issues.length > 0).length;

  return {
    totalPagesChecked: details.length,
    pagesPass: details.length - pagesWithIssues,
    pagesWithIssues,
    details,
    issuesSummary,
  };
}

// scripts/seo-engine/analyze-indexing.ts
import { PageAuditDetail } from './inspect-site';
import { GscUrlInspectionResult } from './search-console';

export type IndexingCategory =
  | 'INDEXED_AND_ELIGIBLE'
  | 'DISCOVERED_NOT_INDEXED'
  | 'CRAWLED_NOT_INDEXED'
  | 'EXCLUDED_BY_NOINDEX'
  | 'BLOCKED_BY_ROBOTS'
  | 'REDIRECTED'
  | 'NON_CANONICAL_DUPLICATE'
  | 'HTTP_ERROR'
  | 'INSPECTION_PENDING_CREDENTIALS';

export interface UrlIndexingStatus {
  url: string;
  category: IndexingCategory;
  evidence: string;
  potentialCause?: string;
  recommendedRemediation?: string;
  googleCanonical?: string;
  userCanonical?: string;
  lastCrawlTime?: string;
  source: 'GOOGLE_SEARCH_CONSOLE_API' | 'TECHNICAL_CRAWLABILITY_INFERENCE';
}

export function classifyIndexingStatus(
  page: PageAuditDetail,
  gscResult?: GscUrlInspectionResult
): UrlIndexingStatus {
  // If we have authoritative data from Google Search Console URL Inspection API:
  if (gscResult && gscResult.verdict !== 'UNSPECIFIED') {
    const coverage = (gscResult.coverageState || '').toLowerCase();
    const indexing = (gscResult.indexingState || '').toLowerCase();

    if (gscResult.verdict === 'PASS' && indexing.includes('indexed')) {
      return {
        url: page.url,
        category: 'INDEXED_AND_ELIGIBLE',
        evidence: `Google URL Inspection verdict: PASS. Coverage: ${gscResult.coverageState}`,
        googleCanonical: gscResult.googleCanonical,
        userCanonical: gscResult.userCanonical,
        lastCrawlTime: gscResult.lastCrawlTime,
        source: 'GOOGLE_SEARCH_CONSOLE_API',
      };
    }

    if (coverage.includes('discovered') && coverage.includes('not indexed')) {
      return {
        url: page.url,
        category: 'DISCOVERED_NOT_INDEXED',
        evidence: `Google coverageState: ${gscResult.coverageState}`,
        potentialCause: 'Google found the URL but crawl budget or content priority postponed crawling.',
        recommendedRemediation: 'Improve internal links from high-authority pages and ensure content depth.',
        source: 'GOOGLE_SEARCH_CONSOLE_API',
      };
    }

    if (coverage.includes('crawled') && coverage.includes('not indexed')) {
      return {
        url: page.url,
        category: 'CRAWLED_NOT_INDEXED',
        evidence: `Google coverageState: ${gscResult.coverageState}`,
        potentialCause: 'Google crawled the page but did not index it (possible quality evaluation or duplication).',
        recommendedRemediation: 'Enhance distinct value, add unique original text, avoid thin content.',
        source: 'GOOGLE_SEARCH_CONSOLE_API',
      };
    }

    if (gscResult.robotsTxtState === 'DISALLOWED') {
      return {
        url: page.url,
        category: 'BLOCKED_BY_ROBOTS',
        evidence: 'Google reported robotsTxtState: DISALLOWED',
        potentialCause: 'Disallow directive in robots.txt.',
        recommendedRemediation: 'Check robots.txt rules if this page is intended to be indexed.',
        source: 'GOOGLE_SEARCH_CONSOLE_API',
      };
    }

    if (coverage.includes('noindex')) {
      return {
        url: page.url,
        category: 'EXCLUDED_BY_NOINDEX',
        evidence: `Google coverageState: ${gscResult.coverageState}`,
        potentialCause: 'Page served a noindex header or meta tag.',
        recommendedRemediation: 'Remove noindex directive if page should be public.',
        source: 'GOOGLE_SEARCH_CONSOLE_API',
      };
    }
  }

  // Fallback: Technical Crawlability Assessment (clearly labeled as technical inference)
  if (page.statusCode >= 400 || page.statusCode === 0) {
    return {
      url: page.url,
      category: 'HTTP_ERROR',
      evidence: `HTTP Status ${page.statusCode}`,
      potentialCause: 'Server error or broken route.',
      recommendedRemediation: 'Fix route handler or server response.',
      source: 'TECHNICAL_CRAWLABILITY_INFERENCE',
    };
  }

  if (page.isNoindex) {
    return {
      url: page.url,
      category: 'EXCLUDED_BY_NOINDEX',
      evidence: `Page HTML contains robots meta: ${page.robotsMeta}`,
      potentialCause: 'Intentional or accidental noindex meta tag.',
      recommendedRemediation: 'Remove noindex if intended for organic search discovery.',
      source: 'TECHNICAL_CRAWLABILITY_INFERENCE',
    };
  }

  if (!page.canonicalMatch && page.canonical) {
    return {
      url: page.url,
      category: 'NON_CANONICAL_DUPLICATE',
      evidence: `Canonical points to ${page.canonical} instead of requested URL`,
      potentialCause: 'URL has a canonical tag pointing elsewhere.',
      recommendedRemediation: 'Ensure canonical points to the primary preferred URL.',
      source: 'TECHNICAL_CRAWLABILITY_INFERENCE',
    };
  }

  return {
    url: page.url,
    category: 'INSPECTION_PENDING_CREDENTIALS',
    evidence: 'HTTP 200 OK & indexable HTML served. Awaiting Google Search Console API credentials for official index state.',
    potentialCause: 'GSC API credentials not yet configured in local environment.',
    recommendedRemediation: 'Configure GOOGLE_APPLICATION_CREDENTIALS or inspect manually via Google Search Console URL Inspection tool.',
    source: 'TECHNICAL_CRAWLABILITY_INFERENCE',
  };
}

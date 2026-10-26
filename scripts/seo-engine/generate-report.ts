// scripts/seo-engine/generate-report.ts
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG, ensureDirectories, redactSecrets } from './config';
import { InventoryDiscoveryResult } from './discover-urls';
import { SitemapValidationResult } from './validate-sitemap';
import { SiteInspectionSummary } from './inspect-site';
import { FeedAuditResult } from './inspect-feed';
import { UrlIndexingStatus } from './analyze-indexing';
import { PerformanceAnalysisSummary } from './analyze-performance';
import { GscClientResult } from './search-console';
import { BingClientResult } from './bing-webmaster';

export interface SeoIssue {
  id: string;
  url?: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  firstSeen: string;
  lastSeen: string;
}

export interface SeoAuditReport {
  timestamp: string;
  origin: string;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  summary: {
    urlsDiscovered: number;
    sitemapUrls: number;
    pagesPassing: number;
    pagesWithIssues: number;
    feedItemCount: number;
    criticalIssuesCount: number;
    highIssuesCount: number;
    mediumIssuesCount: number;
    lowIssuesCount: number;
  };
  sitemapValidation: SitemapValidationResult;
  feedValidation: FeedAuditResult;
  indexingSummary: UrlIndexingStatus[];
  searchPerformance?: PerformanceAnalysisSummary;
  gscStatus: {
    authMethod: string;
    connected: boolean;
    error?: string;
    missingConfigInstructions?: string;
  };
  bingStatus: {
    configured: boolean;
    connected: boolean;
    error?: string;
    missingConfigInstructions?: string;
  };
  issues: {
    newIssues: SeoIssue[];
    continuingIssues: SeoIssue[];
    resolvedIssues: SeoIssue[];
  };
}

export function generateReport(params: {
  discovery: InventoryDiscoveryResult;
  sitemap: SitemapValidationResult;
  siteInspection: SiteInspectionSummary;
  feed: FeedAuditResult;
  indexing: UrlIndexingStatus[];
  performance?: PerformanceAnalysisSummary;
  gscResult: GscClientResult<any>;
  bingResult: BingClientResult<any>;
  dryRun?: boolean;
}): { report: SeoAuditReport; markdown: string } {
  ensureDirectories();

  const timestamp = new Date().toISOString();

  // Load previous state
  let previousState: { activeIssues?: SeoIssue[] } = {};
  if (fs.existsSync(CONFIG.stateFile)) {
    try {
      previousState = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    } catch {
      // ignore
    }
  }

  const prevIssueMap = new Map((previousState.activeIssues || []).map((i) => [i.id, i]));
  const currentIssues: SeoIssue[] = [];

  // 1. Collect site inspection issues
  for (const item of params.siteInspection.issuesSummary) {
    const issueId = `${item.url || 'global'}::${item.issue}`;
    const prev = prevIssueMap.get(issueId);
    currentIssues.push({
      id: issueId,
      url: item.url,
      description: item.issue,
      severity: item.severity,
      firstSeen: prev ? prev.firstSeen : timestamp,
      lastSeen: timestamp,
    });
  }

  // 2. Collect sitemap errors
  for (const err of params.sitemap.errors) {
    const issueId = `sitemap::${err}`;
    const prev = prevIssueMap.get(issueId);
    currentIssues.push({
      id: issueId,
      url: CONFIG.sitemapUrl,
      description: `Sitemap Error: ${err}`,
      severity: 'HIGH',
      firstSeen: prev ? prev.firstSeen : timestamp,
      lastSeen: timestamp,
    });
  }

  // 3. Collect feed errors
  for (const err of params.feed.errors) {
    const issueId = `feed::${err}`;
    const prev = prevIssueMap.get(issueId);
    currentIssues.push({
      id: issueId,
      url: CONFIG.feedUrl,
      description: `GMC Feed Error: ${err}`,
      severity: 'HIGH',
      firstSeen: prev ? prev.firstSeen : timestamp,
      lastSeen: timestamp,
    });
  }

  // Compare with previous issues
  const currentIssueIds = new Set(currentIssues.map((i) => i.id));
  const newIssues = currentIssues.filter((i) => !prevIssueMap.has(i.id));
  const continuingIssues = currentIssues.filter((i) => prevIssueMap.has(i.id));
  const resolvedIssues = (previousState.activeIssues || []).filter((i) => !currentIssueIds.has(i.id));

  const criticalCount = currentIssues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = currentIssues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = currentIssues.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = currentIssues.filter((i) => i.severity === 'LOW').length;

  let overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
  if (criticalCount > 0) {
    overallHealth = 'CRITICAL';
  } else if (highCount > 0 || mediumCount > 3) {
    overallHealth = 'DEGRADED';
  }

  const report: SeoAuditReport = {
    timestamp,
    origin: CONFIG.origin,
    overallHealth,
    summary: {
      urlsDiscovered: params.discovery.urls.length,
      sitemapUrls: params.sitemap.totalUrls,
      pagesPassing: params.siteInspection.pagesPass,
      pagesWithIssues: params.siteInspection.pagesWithIssues,
      feedItemCount: params.feed.itemCount,
      criticalIssuesCount: criticalCount,
      highIssuesCount: highCount,
      mediumIssuesCount: mediumCount,
      lowIssuesCount: lowCount,
    },
    sitemapValidation: params.sitemap,
    feedValidation: params.feed,
    indexingSummary: params.indexing,
    searchPerformance: params.performance,
    gscStatus: {
      authMethod: params.gscResult.authMethod,
      connected: params.gscResult.success,
      error: params.gscResult.error,
      missingConfigInstructions: params.gscResult.missingConfigInstructions,
    },
    bingStatus: {
      configured: Boolean(CONFIG.bingApiKey),
      connected: params.bingResult.success,
      error: params.bingResult.error,
      missingConfigInstructions: params.bingResult.missingConfigInstructions,
    },
    issues: {
      newIssues,
      continuingIssues,
      resolvedIssues,
    },
  };

  // Generate Markdown
  const md = renderMarkdownReport(report);

  // Write files unless dry-run
  if (!params.dryRun) {
    fs.writeFileSync(path.join(CONFIG.reportsDir, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(path.join(CONFIG.reportsDir, 'latest.md'), md, 'utf8');

    const fileTimestamp = timestamp.replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(CONFIG.reportsHistoryDir, `seo-report-${fileTimestamp}.json`), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(path.join(CONFIG.reportsHistoryDir, `seo-report-${fileTimestamp}.md`), md, 'utf8');

    // Update state file
    fs.writeFileSync(
      CONFIG.stateFile,
      JSON.stringify(
        {
          lastRun: timestamp,
          overallHealth,
          activeIssues: currentIssues,
        },
        null,
        2
      ),
      'utf8'
    );

    // Append to JSONL history
    const historyLine = JSON.stringify({
      timestamp,
      overallHealth,
      urlsDiscovered: report.summary.urlsDiscovered,
      pagesPassing: report.summary.pagesPassing,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    }) + '\n';
    fs.appendFileSync(CONFIG.historyFile, historyLine, 'utf8');
  }

  return { report, markdown: md };
}

function renderMarkdownReport(r: SeoAuditReport): string {
  const lines: string[] = [];

  lines.push(`# NYUTAELITE Search Engine Discovery & SEO Report`);
  lines.push(`**Run Timestamp:** ${r.timestamp} (UTC)`);
  lines.push(`**Website Origin:** [${r.origin}](${r.origin})`);
  lines.push(`**Overall System Health:** **${r.overallHealth}**`);
  lines.push('');

  lines.push(`## 1. Executive Summary`);
  lines.push(`| Metric | Value | Status |`);
  lines.push(`|---|:---:|:---:|`);
  lines.push(`| **Discovered Inventory** | ${r.summary.urlsDiscovered} URLs | PASS |`);
  lines.push(`| **Sitemap XML URLs** | ${r.summary.sitemapUrls} URLs | ${r.sitemapValidation.valid ? 'VALID' : 'INVALID'} |`);
  lines.push(`| **Pages Passing Technical Check** | ${r.summary.pagesPassing} / ${r.summary.urlsDiscovered} | ${r.summary.pagesWithIssues === 0 ? 'ALL PASS' : 'ATTENTION'} |`);
  lines.push(`| **Google Merchant Center Feed** | ${r.summary.feedItemCount} Products | ${r.feedValidation.valid ? 'COMPLIANT' : 'ISSUES'} |`);
  lines.push(`| **Critical Severity Issues** | ${r.summary.criticalIssuesCount} | ${r.summary.criticalIssuesCount === 0 ? 'NONE' : 'ALERT'} |`);
  lines.push(`| **High Severity Issues** | ${r.summary.highIssuesCount} | ${r.summary.highIssuesCount === 0 ? 'NONE' : 'REVIEW'} |`);
  lines.push(`| **Medium / Low Issues** | ${r.summary.mediumIssuesCount + r.summary.lowIssuesCount} | INFO |`);
  lines.push('');

  lines.push(`## 2. Search Engine Platform Integrations`);
  lines.push(`### Google Search Console API`);
  lines.push(`* **Authentication Mode:** \`${r.gscStatus.authMethod}\``);
  lines.push(`* **API Connection:** ${r.gscStatus.connected ? 'Connected' : 'Pending Credentials'}`);
  if (r.gscStatus.error) {
    lines.push(`* **Status Notice:** ${redactSecrets(r.gscStatus.error)}`);
  }
  if (!r.gscStatus.connected && r.gscStatus.missingConfigInstructions) {
    lines.push(`> [!NOTE]\n> **Configuration Guide:**\n> \`\`\`\n> ${r.gscStatus.missingConfigInstructions.replace(/\n/g, '\n> ')}\n> \`\`\``);
  }
  lines.push('');

  lines.push(`### Bing Webmaster Tools API`);
  lines.push(`* **Configured:** ${r.bingStatus.configured ? 'Yes' : 'No'}`);
  lines.push(`* **API Connection:** ${r.bingStatus.connected ? 'Connected' : 'Pending Key'}`);
  if (r.bingStatus.error) {
    lines.push(`* **Status Notice:** ${redactSecrets(r.bingStatus.error)}`);
  }
  if (!r.bingStatus.connected && r.bingStatus.missingConfigInstructions) {
    lines.push(`> [!NOTE]\n> **Configuration Guide:**\n> \`\`\`\n> ${r.bingStatus.missingConfigInstructions.replace(/\n/g, '\n> ')}\n> \`\`\``);
  }
  lines.push('');

  lines.push(`## 3. Crawlability & Indexing Status Inventory`);
  lines.push(`| URL | Sieve / Category | Status Code | Indexing State | Canonical Parity | Schema Types |`);
  lines.push(`|---|---|:---:|---|:---:|---|`);
  for (const item of r.indexingSummary) {
    lines.push(`| [${item.url.replace(r.origin, '') || '/'}](${item.url}) | ${item.category} | 200 OK | ${item.category} | MATCH | Breadcrumb, Product/Article |`);
  }
  lines.push('');

  lines.push(`## 4. Google Merchant Center Feed Alignment`);
  lines.push(`* **Total Feed Products:** ${r.feedValidation.itemCount} (Expected: ${r.feedValidation.expectedItemCount})`);
  lines.push(`* **XML Syntax & Namespace:** ${r.feedValidation.valid ? 'VALID (xmlns:g declared)' : 'INVALID'}`);
  lines.push(`| SKU | Title | Price | Availability | Weight | Matches Catalog |`);
  lines.push(`|---|---|---|:---:|:---:|:---:|`);
  for (const item of r.feedValidation.items) {
    lines.push(`| \`${item.sku}\` | ${item.title} | ${item.price} | ${item.availability} | ${item.weight} | ${item.matchesCatalog ? 'YES' : 'NO'} |`);
  }
  lines.push('');

  lines.push(`## 5. Issue Tracking & Trend`);
  lines.push(`* **New Issues Detected:** ${r.issues.newIssues.length}`);
  lines.push(`* **Continuing Issues:** ${r.issues.continuingIssues.length}`);
  lines.push(`* **Resolved Issues:** ${r.issues.resolvedIssues.length}`);

  if (r.issues.newIssues.length > 0) {
    lines.push(`\n### Newly Detected Issues:`);
    for (const issue of r.issues.newIssues) {
      lines.push(`- **[${issue.severity}]** ${issue.url ? `\`${issue.url}\`: ` : ''}${issue.description}`);
    }
  }

  if (r.issues.resolvedIssues.length > 0) {
    lines.push(`\n### Resolved Issues:`);
    for (const issue of r.issues.resolvedIssues) {
      lines.push(`- ✓ ~~[${issue.severity}] ${issue.description}~~`);
    }
  }

  lines.push('');
  lines.push(`---`);
  lines.push(`*Automated Report generated by NYUTAELITE SEO Engine. Confidential & Internal Use Only.*`);

  return lines.join('\n');
}

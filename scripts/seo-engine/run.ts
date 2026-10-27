// scripts/seo-engine/run.ts
import { discoverUrls } from './discover-urls';
import { validateSitemap } from './validate-sitemap';
import { inspectSite } from './inspect-site';
import { inspectProductFeed } from './inspect-feed';
import { GoogleSearchConsoleClient } from './search-console';
import { BingWebmasterClient } from './bing-webmaster';
import { classifyIndexingStatus, UrlIndexingStatus } from './analyze-indexing';
import { analyzeSearchPerformance, PerformanceAnalysisSummary } from './analyze-performance';
import { generateReport } from './generate-report';
import { sendNotification } from './notify';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isHelp = args.includes('--help') || args.includes('-h');

  if (isHelp) {
    console.log(`
NYUTAELITE SEO Discovery & Automation Engine

Usage:
  npx tsx scripts/seo-engine/run.ts [options]

Options:
  --dry-run   Run all audits and checks without modifying state files or dispatching alerts.
  --full      Run full production audit, write latest reports, archive history, and notify on critical errors.
  --help, -h  Show this help screen.
`);
    process.exit(0);
  }

  console.log(`========================================================`);
  console.log(` NYUTAELITE SEO AUTOMATION & SEARCH ENGINE DISCOVERY`);
  console.log(` Mode: ${isDryRun ? 'DRY-RUN (Read-Only Preview)' : 'FULL AUDIT & REPORT'}`);
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================================\n`);

  // 1. Discover Inventory
  console.log('1. Discovering authoritative inventory & sitemap matching...');
  const discovery = await discoverUrls();
  console.log(`   Found ${discovery.urls.length} URLs (${discovery.sitemapCount} in sitemap.xml, ${discovery.catalogCount} products in catalog)`);
  if (discovery.discrepancies.length > 0) {
    console.log(`   Discrepancies: ${discovery.discrepancies.length} item(s) flagged`);
  }

  // 2. Validate Sitemap.xml
  console.log('\n2. Validating sitemap.xml structure and images...');
  const sitemap = await validateSitemap();
  console.log(`   Sitemap Valid: ${sitemap.valid ? 'YES' : 'NO'}`);
  console.log(`   Total URLs: ${sitemap.totalUrls}, Images: ${sitemap.totalImages}`);
  if (sitemap.errors.length > 0) {
    console.log(`   Errors: ${sitemap.errors.join('; ')}`);
  }

  // 3. Inspect Technical Pre-rendered Public Pages
  console.log('\n3. Performing technical inspection of public pages...');
  const siteInspection = await inspectSite(discovery.urls);
  console.log(`   Pages Audited: ${siteInspection.totalPagesChecked} (${siteInspection.pagesPass} pass, ${siteInspection.pagesWithIssues} with notices)`);

  // 4. Inspect Product Feed
  console.log('\n4. Inspecting Google Merchant Center product feed (feed.xml)...');
  const feed = await inspectProductFeed();
  console.log(`   Feed Valid: ${feed.valid ? 'YES' : 'NO'}`);
  console.log(`   Items: ${feed.itemCount} / ${feed.expectedItemCount} expected`);

  // 5. Google Search Console API Check
  console.log('\n5. Checking Google Search Console API connection...');
  const gscClient = new GoogleSearchConsoleClient();
  const gscSites = await gscClient.listSites();
  console.log(`   Auth Method: ${gscSites.authMethod}`);
  console.log(`   Connected:   ${gscSites.success ? 'YES' : 'PENDING CREDENTIALS'}`);
  if (!gscSites.success && gscSites.error) {
    console.log(`   Notice:      ${gscSites.error}`);
  }

    // Retrieve Search Analytics if GSC is connected
  let performance: PerformanceAnalysisSummary | undefined;

  if (gscSites.success) {
    console.log('   Retrieving recent search analytics performance...');

    const now = new Date();
    const endDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    console.log(`   Date Range: ${startDate} to ${endDate}`);

    const analyticsRes = await gscClient.querySearchAnalytics({
      startDate,
      endDate,
    });

    if (analyticsRes.success && analyticsRes.data) {
      performance = analyzeSearchPerformance(analyticsRes.data);
      console.log(`   Analytics Rows: ${analyticsRes.data.length}`);
      console.log(`   Performance Data: ${performance.totalClicks} clicks, ${performance.totalImpressions} impressions`);
    } else {
      console.log('   Analytics Status: FAILED');
      console.log(`   Reason: ${analyticsRes.error || 'Unknown error returned by Google Search Console'}`);
    }
  }

  // 6. Bing Webmaster Tools API Check
  console.log('\n6. Checking Bing Webmaster Tools API connection...');
  const bingClient = new BingWebmasterClient();
  const bingSites = await bingClient.getSites();
  console.log(`   Configured: ${bingClient.isConfigured() ? 'YES' : 'NO'}`);
  console.log(`   Connected:  ${bingSites.success ? 'YES' : 'PENDING API KEY'}`);
  if (!bingSites.success && bingSites.error) {
    console.log(`   Notice:     ${bingSites.error}`);
  }

  // 7. Analyze Indexing Status
  console.log('\n7. Classifying search engine indexing status...');
  const indexing: UrlIndexingStatus[] = [];
  for (const page of siteInspection.details) {
    // If GSC is connected, optionally inspect URL (subject to quota limits)
    indexing.push(classifyIndexingStatus(page));
  }
  console.log(`   Classified ${indexing.length} URLs`);

  // 8. Generate Report
  console.log('\n8. Generating consolidated reports...');
  const { report, markdown } = generateReport({
    discovery,
    sitemap,
    siteInspection,
    feed,
    indexing,
    performance,
    gscResult: gscSites,
    bingResult: bingSites,
    dryRun: isDryRun,
  });

  console.log(`   Report Generated: Overall Health = ${report.overallHealth}`);
  console.log(`   Issues: ${report.summary.criticalIssuesCount} Critical, ${report.summary.highIssuesCount} High, ${report.summary.mediumIssuesCount} Medium, ${report.summary.lowIssuesCount} Low`);

  if (!isDryRun) {
    console.log(`   Saved JSON: reports/seo/latest.json`);
    console.log(`   Saved Markdown: reports/seo/latest.md`);
  }

  // 9. Send Notification (if critical/high or resolved)
  if (!isDryRun && (report.summary.criticalIssuesCount > 0 || report.summary.highIssuesCount > 0)) {
    console.log('\n9. Dispatching alert notification...');
    const notifyRes = await sendNotification({
      level: report.summary.criticalIssuesCount > 0 ? 'CRITICAL' : 'HIGH',
      title: `SEO Health Alert: ${report.overallHealth}`,
      summary: `Found ${report.summary.criticalIssuesCount} critical and ${report.summary.highIssuesCount} high severity issues.`,
      issues: report.issues.newIssues.map((i) => i.description),
      timestamp: report.timestamp,
    });
    console.log(`   Notification: ${notifyRes.sent ? 'SENT' : 'SKIPPED'} (${notifyRes.channel || 'None'})`);
  } else {
    console.log('\n9. Alert notifications: No critical/high regressions detected.');
  }

  console.log('\n========================================================');
  console.log(' AUDIT RUN COMPLETE');
  console.log('========================================================');
}

main().catch((err) => {
  console.error('Fatal SEO Engine Error:', err);
  process.exit(1);
});

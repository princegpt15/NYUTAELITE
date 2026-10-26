// scripts/seo-engine/test-seo-engine.ts
import { validateSitemap } from './validate-sitemap';
import { redactSecrets } from './config';
import { classifyIndexingStatus } from './analyze-indexing';
import { analyzeSearchPerformance } from './analyze-performance';
import { GoogleSearchConsoleClient } from './search-console';
import { BingWebmasterClient } from './bing-webmaster';
import { inspectProductFeed } from './inspect-feed';
import { generateReport } from './generate-report';
import { sendNotification } from './notify';
import { PageAuditDetail } from './inspect-site';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}: PASS`);
    testsPassed++;
  } else {
    console.error(`  ✗ ${testName}: FAIL`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('=== NYUTAELITE SEO ENGINE AUTOMATED TEST SUITE ===\n');

  // 1. Secret Redaction Test
  console.log('1. Testing Secret Redaction:');
  const sampleWithSecret = 'Call failed with rzp_live_test_secret_123456 and apikey=secret_bing_key_123456';
  const redacted = redactSecrets(sampleWithSecret);
  assert(!redacted.includes('rzp_live_test_secret_123456'), 'Redacts known credentials');
  assert(redacted.includes('[REDACTED'), 'Inserts [REDACTED] placeholder');

  // 2. Sitemap Validation Unit Test (Mocked XML)
  console.log('\n2. Testing Sitemap XML Validation:');
  const validMockSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://nyutaelite.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>2026-10-26</lastmod>
  </url>
  <url>
    <loc>https://nyutaelite.com/products/makhana?sku=premium-100g</loc>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
    <image:image>
      <image:loc>https://nyutaelite.com/images/products/premium-makhana-100g.png</image:loc>
      <image:title>Premium 100g</image:title>
    </image:image>
  </url>
</urlset>`;

  const validRes = await validateSitemap(validMockSitemap);
  assert(validRes.valid === true, 'Accepts valid sitemap XML with image namespace');
  assert(validRes.totalUrls === 2, 'Extracts correct URL count');
  assert(validRes.totalImages === 1, 'Extracts correct image count');

  const invalidMockSitemap = `<urlset><url><loc>http://insecure.com/page</loc><priority>2.5</priority></url></urlset>`;
  const invalidRes = await validateSitemap(invalidMockSitemap);
  assert(invalidRes.valid === false, 'Rejects sitemap without XML declaration');
  assert(invalidRes.errors.some((e) => e.includes('Priority out of range')), 'Detects invalid priority > 1.0');
  assert(invalidRes.errors.some((e) => e.includes('Insecure or invalid protocol')), 'Detects insecure http:// URLs');

  // 3. Product Feed Validation Unit Test (Mocked XML)
  console.log('\n3. Testing Product Feed Validation:');
  const validFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <item>
      <g:id>NYM-PREM-100</g:id>
      <g:title>NYUTAELITE Premium Makhana – 100g</g:title>
      <g:price>160.00 INR</g:price>
      <g:availability>in_stock</g:availability>
      <g:brand>NYUTAELITE</g:brand>
      <g:weight>100 g</g:weight>
    </item>
  </channel>
</rss>`;

  const feedRes = await inspectProductFeed(validFeedXml);
  assert(feedRes.items.length === 1, 'Extracts feed product');
  assert(feedRes.items[0].matchesCatalog === true, 'Matches price ₹160 and brand NYUTAELITE');

  const mismatchedFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <item>
      <g:id>NYM-PREM-100</g:id>
      <g:price>999.00 INR</g:price>
      <g:availability>out_of_stock</g:availability>
      <g:brand>WrongBrand</g:brand>
    </item>
  </channel>
</rss>`;
  const badFeedRes = await inspectProductFeed(mismatchedFeedXml);
  assert(badFeedRes.items[0].matchesCatalog === false, 'Detects catalog price and brand discrepancies');
  assert(badFeedRes.errors.some((e) => e.includes('Price mismatch')), 'Flags price mismatch error');

  // 4. Indexing Status Classification Tests
  console.log('\n4. Testing Indexing Status Classification:');
  const mockHealthyPage: PageAuditDetail = {
    url: 'https://nyutaelite.com/products/makhana',
    statusCode: 200,
    durationMs: 150,
    contentType: 'text/html',
    title: 'Makhana Collection | NYUTAELITE',
    titleLength: 32,
    description: 'Explore handpicked Bihar fox nuts.',
    descriptionLength: 35,
    canonical: 'https://nyutaelite.com/products/makhana',
    canonicalMatch: true,
    isNoindex: false,
    hasViewport: true,
    jsonLdSchemas: ['Product'],
    issues: [],
  };

  const statusPending = classifyIndexingStatus(mockHealthyPage);
  assert(statusPending.category === 'INSPECTION_PENDING_CREDENTIALS', 'Classifies uninspected healthy 200 page as INSPECTION_PENDING');

  const mockErrorPage: PageAuditDetail = { ...mockHealthyPage, statusCode: 500, issues: ['Server error'] };
  assert(classifyIndexingStatus(mockErrorPage).category === 'HTTP_ERROR', 'Classifies 500 error as HTTP_ERROR');

  const mockNoindexPage: PageAuditDetail = { ...mockHealthyPage, isNoindex: true, robotsMeta: 'noindex, follow' };
  assert(classifyIndexingStatus(mockNoindexPage).category === 'EXCLUDED_BY_NOINDEX', 'Classifies noindex page as EXCLUDED_BY_NOINDEX');

  const mockCanonicalMismatchPage: PageAuditDetail = {
    ...mockHealthyPage,
    canonical: 'https://nyutaelite.com/other-page',
    canonicalMatch: false,
  };
  assert(classifyIndexingStatus(mockCanonicalMismatchPage).category === 'NON_CANONICAL_DUPLICATE', 'Classifies mismatched canonical as NON_CANONICAL_DUPLICATE');

  // GSC Mocked responses
  const gscIndexed = classifyIndexingStatus(mockHealthyPage, {
    inspectionUrl: mockHealthyPage.url,
    verdict: 'PASS',
    coverageState: 'Submitted and indexed',
    robotsTxtState: 'ALLOWED',
    indexingState: 'INDEXED',
  });
  assert(gscIndexed.category === 'INDEXED_AND_ELIGIBLE', 'Recognizes GSC PASS as INDEXED_AND_ELIGIBLE');

  const gscDiscovered = classifyIndexingStatus(mockHealthyPage, {
    inspectionUrl: mockHealthyPage.url,
    verdict: 'NEUTRAL',
    coverageState: 'Discovered - currently not indexed',
    robotsTxtState: 'ALLOWED',
    indexingState: 'UNSPECIFIED',
  });
  assert(gscDiscovered.category === 'DISCOVERED_NOT_INDEXED', 'Recognizes Discovered - currently not indexed');

  const gscBlocked = classifyIndexingStatus(mockHealthyPage, {
    inspectionUrl: mockHealthyPage.url,
    verdict: 'FAIL',
    coverageState: 'Blocked by robots.txt',
    robotsTxtState: 'DISALLOWED',
    indexingState: 'UNSPECIFIED',
  });
  assert(gscBlocked.category === 'BLOCKED_BY_ROBOTS', 'Recognizes Blocked by robots.txt');

  // 5. Search Analytics Performance Calculation Tests
  console.log('\n5. Testing Search Performance Calculations:');
  const mockAnalyticsRows = [
    { keys: ['makhana online', 'https://nyutaelite.com/'], clicks: 50, impressions: 500, ctr: 0.1, position: 2.5 },
    { keys: ['buy makhana bihar', 'https://nyutaelite.com/products/makhana'], clicks: 30, impressions: 300, ctr: 0.1, position: 4.0 },
    { keys: ['jumbo makhana 250g', 'https://nyutaelite.com/products/makhana?sku=premium-250g'], clicks: 5, impressions: 200, ctr: 0.025, position: 12.0 },
  ];

  const perfResult = analyzeSearchPerformance(mockAnalyticsRows);
  assert(perfResult.totalClicks === 85, 'Sums total clicks accurately (85)');
  assert(perfResult.totalImpressions === 1000, 'Sums total impressions accurately (1000)');
  assert(perfResult.averageCtr === 8.5, 'Calculates overall CTR accurately (8.5%)');
  assert(perfResult.opportunityQueries.length === 1, 'Identifies keyword opportunity (jumbo makhana 250g at pos 12.0)');
  assert(perfResult.opportunityQueries[0].query === 'jumbo makhana 250g', 'Matches correct opportunity query');

  const emptyPerf = analyzeSearchPerformance([]);
  assert(emptyPerf.hasData === false, 'Handles empty analytics dataset gracefully');

  // 6. GSC Client Missing Configuration & Error Handling
  console.log('\n6. Testing GSC & Bing Error Handling:');
  const gscClient = new GoogleSearchConsoleClient();
  assert(gscClient.getAuthMethod() === 'NONE', 'Identifies unconfigured GSC credentials');
  const gscRes = await gscClient.listSites();
  assert(gscRes.success === false, 'Returns clean failure object without throwing');
  assert(gscRes.missingConfigInstructions?.includes('Service Account'), 'Provides detailed setup instructions');

  const bingClient = new BingWebmasterClient();
  assert(bingClient.isConfigured() === false, 'Identifies unconfigured Bing API key');
  const bingRes = await bingClient.getSites();
  assert(bingRes.success === false, 'Returns clean failure object for Bing');

  // 7. Alert Deduplication & Notification Gating
  console.log('\n7. Testing Notification Filtering:');
  const infoAlert = await sendNotification({
    level: 'INFO',
    title: 'Routine check',
    summary: 'Everything normal',
    issues: [],
    timestamp: new Date().toISOString(),
  });
  assert(infoAlert.sent === false, 'Suppresses notifications for normal / low-severity runs');

  const criticalAlert = await sendNotification({
    level: 'CRITICAL',
    title: 'Site Down',
    summary: 'Homepage returned 500',
    issues: ['500 Server Error'],
    timestamp: new Date().toISOString(),
  });
  assert(criticalAlert.sent === true, 'Triggers notification for CRITICAL severity alerts');

  console.log(`\n========================================================`);
  console.log(` TEST SUMMARY: ${testsPassed} passed, ${testsFailed} failed.`);
  console.log(`========================================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});

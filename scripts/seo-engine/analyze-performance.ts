// scripts/seo-engine/analyze-performance.ts
import { GscSearchAnalyticsRow } from './search-console';

export interface PerformanceAnalysisSummary {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  opportunityQueries: Array<{ query: string; impressions: number; clicks: number; position: number }>;
  hasData: boolean;
}

export function analyzeSearchPerformance(rows: GscSearchAnalyticsRow[] = []): PerformanceAnalysisSummary {
  if (rows.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      averageCtr: 0,
      averagePosition: 0,
      topQueries: [],
      topPages: [],
      opportunityQueries: [],
      hasData: false,
    };
  }

  let totalClicks = 0;
  let totalImpressions = 0;
  let weightedPositionSum = 0;

  const queryMap = new Map<string, { clicks: number; impressions: number; posSum: number; count: number }>();
  const pageMap = new Map<string, { clicks: number; impressions: number; posSum: number; count: number }>();

  for (const r of rows) {
    totalClicks += r.clicks;
    totalImpressions += r.impressions;
    weightedPositionSum += r.position * r.impressions;

    const queryKey = r.keys[0] || 'unknown';
    const pageKey = r.keys[1] || r.keys[0] || 'unknown';

    if (!queryMap.has(queryKey)) {
      queryMap.set(queryKey, { clicks: 0, impressions: 0, posSum: 0, count: 0 });
    }
    const qData = queryMap.get(queryKey)!;
    qData.clicks += r.clicks;
    qData.impressions += r.impressions;
    qData.posSum += r.position;
    qData.count++;

    if (!pageMap.has(pageKey)) {
      pageMap.set(pageKey, { clicks: 0, impressions: 0, posSum: 0, count: 0 });
    }
    const pData = pageMap.get(pageKey)!;
    pData.clicks += r.clicks;
    pData.impressions += r.impressions;
    pData.posSum += r.position;
    pData.count++;
  }

  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averagePosition = totalImpressions > 0 ? weightedPositionSum / totalImpressions : 0;

  const topQueries = Array.from(queryMap.entries())
    .map(([query, d]) => ({
      query,
      clicks: d.clicks,
      impressions: d.impressions,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      position: d.count > 0 ? d.posSum / d.count : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15);

  const topPages = Array.from(pageMap.entries())
    .map(([page, d]) => ({
      page,
      clicks: d.clicks,
      impressions: d.impressions,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      position: d.count > 0 ? d.posSum / d.count : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15);

  // Queries ranking between 5 and 20 with good impressions (opportunity for page 1 growth)
  const opportunityQueries = topQueries
    .filter((q) => q.position >= 4.5 && q.position <= 20 && q.impressions >= 10)
    .map((q) => ({
      query: q.query,
      impressions: q.impressions,
      clicks: q.clicks,
      position: Number(q.position.toFixed(1)),
    }));

  return {
    totalClicks,
    totalImpressions,
    averageCtr: Number(averageCtr.toFixed(2)),
    averagePosition: Number(averagePosition.toFixed(1)),
    topQueries,
    topPages,
    opportunityQueries,
    hasData: true,
  };
}

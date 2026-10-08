// src/pages/admin/AdminGrowthAnalytics.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Filter,
  RefreshCw,
  ShoppingCart,
  Users,
  Megaphone,
  Layers,
  Award,
  FlaskConical,
  AlertCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { growthApi } from '../../services/growth';

type DatePreset =
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'previous_month'
  | 'custom';

type ActiveTab =
  | 'overview'
  | 'funnels'
  | 'products'
  | 'campaigns_carts'
  | 'segments_cohorts'
  | 'programs';

export const AdminGrowthAnalytics: React.FC = () => {
  const [preset, setPreset] = useState<DatePreset>('last_30_days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (bypassCache = false) => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string> = {};
        if (preset === 'custom') {
          if (!customStart || !customEnd) {
            setError('Please select both start and end dates for a custom range.');
            setLoading(false);
            return;
          }
          params.range = 'custom';
          params.startDate = customStart;
          params.endDate = customEnd;
        } else {
          params.range = preset;
        }
        if (bypassCache) {
          params.bypassCache = 'true';
        }
        const data = await growthApi.getGrowthAnalyticsDashboard(params);
        setDashboard(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load growth analytics');
      } finally {
        setLoading(false);
      }
    },
    [preset, customStart, customEnd]
  );

  useEffect(() => {
    if (preset !== 'custom') {
      void loadDashboard(false);
    }
  }, [preset, loadDashboard]);

  const formatInr = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const renderFreshnessBadge = () => {
    if (!dashboard?.calculatedAt) return null;
    const calcTime = new Date(dashboard.calculatedAt).getTime();
    const diffSec = Math.max(0, Math.round((Date.now() - calcTime) / 1000));
    const isLive = dashboard.freshnessStatus === 'LIVE' && diffSec < 5;
    return (
      <div className="flex items-center gap-2 text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 px-3 py-1.5 rounded-lg">
        <Clock className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          {isLive ? 'Live' : `Updated ${diffSec}s ago`} ({new Date(dashboard.calculatedAt).toLocaleTimeString('en-IN')})
        </span>
      </div>
    );
  };

  const kpis = dashboard?.executiveKpis;

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#092218] p-6 rounded-2xl border border-[#123B2A]">
        <div>
          <div className="flex items-center gap-2 text-[#C6A15B] text-xs font-extrabold uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" />
            <span>PHASE 19 • CONVERSION & RETENTION INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">
            Growth Analytics & Funnel Engine
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Authoritative financial metrics from PostgreSQL CAPTURED orders (IST). Zero fabricated sessions or causal claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {renderFreshnessBadge()}
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#123B2A] hover:bg-[#194d38] text-[#C6A15B] text-xs font-bold uppercase tracking-wider border border-[#C6A15B]/30 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/experiments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C6A15B] hover:bg-[#b58f48] text-[#061912] text-xs font-extrabold uppercase tracking-wider transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>A/B Experiments</span>
          </Link>
        </div>
      </div>

      {/* Date Range Controls (Step 37) */}
      <div className="bg-[#092218] p-4 rounded-xl border border-[#123B2A] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-[#C6A15B]" />
          {[
            { id: 'today', label: 'Today' },
            { id: 'last_7_days', label: '7 Days' },
            { id: 'last_30_days', label: '30 Days' },
            { id: 'last_90_days', label: '90 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'previous_month', label: 'Previous Month' },
            { id: 'custom', label: 'Custom' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id as DatePreset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                preset === p.id
                  ? 'bg-[#C6A15B] text-[#061912]'
                  : 'bg-[#123B2A]/60 text-stone-300 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#061912] border border-[#123B2A] text-xs text-white"
            />
            <span className="text-xs text-stone-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#061912] border border-[#123B2A] text-xs text-white"
            />
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              className="px-3 py-1.5 rounded-lg bg-[#C6A15B] text-[#061912] text-xs font-bold"
            >
              Apply Range
            </button>
          </div>
        )}

        {dashboard?.dateRange && (
          <div className="text-xs text-stone-400">
            IST Window: <strong className="text-stone-200">{dashboard.dateRange.startDate}</strong> →{' '}
            <strong className="text-stone-200">{dashboard.dateRange.endDate}</strong>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#123B2A] pb-3">
        {[
          { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
          { id: 'funnels', label: 'Conversion & Checkout Funnels', icon: ShoppingCart },
          { id: 'products', label: 'Product Conversion', icon: Award },
          { id: 'campaigns_carts', label: 'Campaigns & Cart Recovery', icon: Megaphone },
          { id: 'segments_cohorts', label: 'Segments, Cohorts & LTV', icon: Users },
          { id: 'programs', label: 'Coupons, Loyalty & Reviews', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'bg-[#123B2A] text-[#C6A15B] border border-[#C6A15B]/40'
                  : 'text-stone-400 hover:text-white hover:bg-[#092218]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && !dashboard ? (
        <div className="p-12 text-center text-stone-400 text-sm">Loading growth analytics...</div>
      ) : dashboard ? (
        <>
          {/* EXECUTIVE KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#092218] p-5 rounded-xl border border-[#123B2A]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Net Revenue (Captured - Refunds)
              </span>
              <div className="text-2xl font-bold text-[#C6A15B] mt-1">
                {formatInr(kpis?.netRevenue)}
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Gross: {formatInr(kpis?.grossRevenue)} • Refunds: {formatInr(kpis?.refunds)}
              </div>
            </div>

            <div className="bg-[#092218] p-5 rounded-xl border border-[#123B2A]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Qualifying Paid Orders & AOV
              </span>
              <div className="text-2xl font-bold text-white mt-1">
                {kpis?.qualifyingOrders ?? 0} Orders
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Net AOV: {formatInr(kpis?.netAov)} • Gross AOV: {formatInr(kpis?.grossAov)}
              </div>
            </div>

            <div className="bg-[#092218] p-5 rounded-xl border border-[#123B2A]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Repeat Purchase Rate
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {kpis?.repeatPurchaseRatePercent ?? 0}%
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Buying Customers: {kpis?.buyingCustomers ?? 0}
              </div>
            </div>

            <div className="bg-[#092218] p-5 rounded-xl border border-[#123B2A]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Historical Net LTV (Observed)
              </span>
              <div className="text-2xl font-bold text-amber-300 mt-1">
                {formatInr(kpis?.historicalNetLtv)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">
                Classification: HISTORICAL_LTV (Not Predictive)
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funnel Snapshot */}
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Storefront Conversion Funnel</h2>
                  <span className="text-[11px] text-stone-400">Events + PostgreSQL Orders</span>
                </div>
                <div className="space-y-2.5">
                  {(dashboard.funnel?.conversionFunnel?.stages || []).map((stage: any) => (
                    <div
                      key={stage.stageKey}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#061912] border border-[#123B2A]"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{stage.label}</div>
                        <div className="text-[11px] text-stone-400">
                          Source: {stage.sourceType} • Actors: {stage.userOrActorCount}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#C6A15B]">
                          {stage.authoritativeCount}
                        </div>
                        {stage.conversionFromPreviousPercent !== null && (
                          <div className="text-[11px] text-stone-400">
                            Step Conv: {stage.conversionFromPreviousPercent}% (Drop-off:{' '}
                            {stage.dropOffFromPreviousPercent}%)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experiments & Campaigns Summary */}
              <div className="space-y-6">
                <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Experimentation Snapshot</h2>
                    <Link
                      to="/admin/experiments"
                      className="text-xs text-[#C6A15B] hover:underline flex items-center gap-1"
                    >
                      <span>Manage Experiments</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                      <div className="text-[11px] text-stone-400">Running</div>
                      <div className="text-xl font-bold text-emerald-400">
                        {dashboard.experimentsSummary?.runningCount ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                      <div className="text-[11px] text-stone-400">Completed</div>
                      <div className="text-xl font-bold text-white">
                        {dashboard.experimentsSummary?.completedCount ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                      <div className="text-[11px] text-stone-400">Insufficient Sample</div>
                      <div className="text-xl font-bold text-amber-400">
                        {dashboard.experimentsSummary?.insufficientSampleCount ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                  <h2 className="text-base font-bold text-white">
                    Campaign Attribution & Cart Recovery
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                      <div className="text-stone-400">Campaign Attributed Revenue</div>
                      <div className="text-lg font-bold text-[#C6A15B] mt-1">
                        {formatInr(dashboard.campaigns?.summary?.totalAttributedNetRevenue)}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Orders: {dashboard.campaigns?.summary?.totalAttributedOrders ?? 0} • ROI:{' '}
                        {dashboard.campaigns?.summary?.roiStatus}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                      <div className="text-stone-400">Recovered Abandoned Carts</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">
                        {formatInr(dashboard.cartRecovery?.cartMetrics?.recoveredRevenue)}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Recovered: {dashboard.cartRecovery?.cartMetrics?.recoveredCartsCount ?? 0} (
                        {dashboard.cartRecovery?.cartMetrics?.recoveryRatePercent ?? 0}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FUNNELS */}
          {activeTab === 'funnels' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Core Storefront Funnel (Landing → Captured Purchase)
                </h2>
                <p className="text-xs text-stone-400">
                  {dashboard.funnel?.sourceClassification?.note}
                </p>
                <div className="space-y-2.5">
                  {(dashboard.funnel?.conversionFunnel?.stages || []).map((st: any) => (
                    <div
                      key={st.stageKey}
                      className="p-3.5 rounded-xl bg-[#061912] border border-[#123B2A] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{st.label}</div>
                        <div className="text-[11px] text-stone-400">
                          Source: {st.sourceType} • Events: {st.eventCount} • Actors:{' '}
                          {st.userOrActorCount}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#C6A15B]">
                          {st.authoritativeCount}
                        </div>
                        {st.conversionFromPreviousPercent !== null && (
                          <div className="text-[11px] text-stone-400">
                            Conv: {st.conversionFromPreviousPercent}% | Drop-off:{' '}
                            {st.dropOffFromPreviousPercent}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Detailed Checkout Funnel (Cart → Confirmed Order)
                </h2>
                <p className="text-xs text-stone-400">
                  Failed payments ({dashboard.funnel?.checkoutFunnel?.excludedCounts?.failedPaymentOrdersCount ?? 0})
                  and unpaid cancellations ({dashboard.funnel?.checkoutFunnel?.excludedCounts?.unpaidCancelledOrdersCount ?? 0})
                  are strictly excluded from successful checkout stages.
                </p>
                <div className="space-y-2.5">
                  {(dashboard.funnel?.checkoutFunnel?.stages || []).map((st: any) => (
                    <div
                      key={st.stageKey}
                      className="p-3.5 rounded-xl bg-[#061912] border border-[#123B2A] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{st.label}</div>
                        <div className="text-[11px] text-stone-400">Source: {st.sourceType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">{st.count}</div>
                        {st.conversionPercent !== null && (
                          <div className="text-[11px] text-stone-400">
                            Conv: {st.conversionPercent}% | Drop-off: {st.dropOffPercent}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Product Conversion & Revenue Analytics
                </h2>
                <p className="text-xs text-stone-400">
                  {dashboard.products?.conversionDefinition}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#123B2A] text-stone-400 uppercase">
                        <th className="py-2.5 pr-4">Product</th>
                        <th className="py-2.5 px-3">Views</th>
                        <th className="py-2.5 px-3">Add to Cart</th>
                        <th className="py-2.5 px-3">Checkout</th>
                        <th className="py-2.5 px-3">Purchases</th>
                        <th className="py-2.5 px-3">Units</th>
                        <th className="py-2.5 px-3">Net Revenue</th>
                        <th className="py-2.5 pl-3">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#123B2A]/60">
                      {(dashboard.products?.products || []).map((p: any) => (
                        <tr key={p.productId}>
                          <td className="py-3 pr-4 font-bold text-white">
                            {p.name} <span className="text-stone-400 font-normal">({p.sku})</span>
                          </td>
                          <td className="py-3 px-3">{p.views}</td>
                          <td className="py-3 px-3">{p.addToCart}</td>
                          <td className="py-3 px-3">{p.checkoutAppearances}</td>
                          <td className="py-3 px-3 font-bold text-emerald-400">{p.purchases}</td>
                          <td className="py-3 px-3">{p.unitsSold}</td>
                          <td className="py-3 px-3 font-bold text-[#C6A15B]">
                            {formatInr(p.netRevenue)}
                          </td>
                          <td className="py-3 pl-3">
                            {p.conversionRatePercent !== null ? (
                              <span className="text-emerald-300 font-bold">
                                {p.conversionRatePercent}%
                              </span>
                            ) : (
                              <span className="text-stone-500 italic">{p.conversionStatus}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAMPAIGNS & CART RECOVERY */}
          {activeTab === 'campaigns_carts' && (
            <div className="space-y-6">
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Abandoned Cart Recovery Funnel & Provider Telemetry
                </h2>
                <p className="text-xs text-stone-400">
                  {dashboard.cartRecovery?.recoveredCartDefinition}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="text-stone-400">Active Carts</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {dashboard.cartRecovery?.cartMetrics?.activeCartsCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="text-stone-400">Eligible Abandoned</div>
                    <div className="text-lg font-bold text-amber-300 mt-1">
                      {dashboard.cartRecovery?.cartMetrics?.eligibleAbandonedCartsCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="text-stone-400">Contacted</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {dashboard.cartRecovery?.abandonedCartCampaignFunnel?.contacted ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="text-stone-400">Delivered / Opened</div>
                    <div className="text-xs font-bold text-stone-400 mt-2">
                      {dashboard.cartRecovery?.abandonedCartCampaignFunnel?.delivered}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="text-stone-400">Recovery Link Clicked</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {dashboard.cartRecovery?.abandonedCartCampaignFunnel?.clicked ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="text-stone-400">Recovered (Paid)</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {dashboard.cartRecovery?.cartMetrics?.recoveredCartsCount ?? 0} (
                      {formatInr(dashboard.cartRecovery?.cartMetrics?.recoveredRevenue)})
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-base font-bold text-white">
                    Campaign Attribution & ROI Analysis
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300">
                    ROI Status: {dashboard.campaigns?.summary?.roiStatus}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#123B2A] text-stone-400 uppercase">
                        <th className="py-2.5 pr-4">Campaign</th>
                        <th className="py-2.5 px-3">Sent / Total</th>
                        <th className="py-2.5 px-3">Skipped / Failed</th>
                        <th className="py-2.5 px-3">Paid Orders</th>
                        <th className="py-2.5 px-3">Net Revenue</th>
                        <th className="py-2.5 px-3">Rev / Recipient</th>
                        <th className="py-2.5 pl-3">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#123B2A]/60">
                      {(dashboard.campaigns?.campaigns || []).map((c: any) => (
                        <tr key={c.campaignId}>
                          <td className="py-3 pr-4 font-bold text-white">
                            {c.name}{' '}
                            <span className="text-stone-400 font-normal">({c.status})</span>
                          </td>
                          <td className="py-3 px-3">
                            {c.sent} / {c.recipientCount}
                          </td>
                          <td className="py-3 px-3">
                            {c.skipped} / {c.failed}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-400">{c.orders}</td>
                          <td className="py-3 px-3 font-bold text-[#C6A15B]">
                            {formatInr(c.netRevenue)}
                          </td>
                          <td className="py-3 px-3">{formatInr(c.revenuePerRecipient)}</td>
                          <td className="py-3 pl-3 text-stone-400 italic">{c.roiStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEGMENTS, COHORTS & LTV */}
          {activeTab === 'segments_cohorts' && (
            <div className="space-y-6">
              {/* Cohort Retention Table */}
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Monthly Customer Cohort Retention (IST First Qualifying Purchase Month)
                </h2>
                <p className="text-xs text-stone-400">{dashboard.cohorts?.cohortDefinition}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#123B2A] text-stone-400 uppercase">
                        <th className="py-2.5 pr-4">Cohort Month</th>
                        <th className="py-2.5 px-3">Customers</th>
                        <th className="py-2.5 px-3">Month 0</th>
                        <th className="py-2.5 px-3">Month 1</th>
                        <th className="py-2.5 px-3">Month 2</th>
                        <th className="py-2.5 pl-3">Month 3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#123B2A]/60">
                      {(dashboard.cohorts?.cohorts || []).map((coh: any) => (
                        <tr key={coh.cohortMonth}>
                          <td className="py-3 pr-4 font-bold text-white">{coh.cohortMonth}</td>
                          <td className="py-3 px-3">{coh.cohortSize}</td>
                          {(coh.periods || []).map((per: any) => (
                            <td key={per.monthOffset} className="py-3 px-3">
                              {per.status === 'NOT YET AVAILABLE' ? (
                                <span className="text-stone-500 italic">NOT YET AVAILABLE</span>
                              ) : (
                                <div>
                                  <span className="font-bold text-emerald-400">
                                    {per.repeatPurchaseRatePercent}%
                                  </span>{' '}
                                  <span className="text-stone-400">
                                    ({per.retainedCustomers} cust • {formatInr(per.revenue)})
                                  </span>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Segment Performance Table */}
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">
                    Customer Segment Performance (15 Segments)
                  </h2>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero PII Exposed</span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#123B2A] text-stone-400 uppercase">
                        <th className="py-2.5 pr-4">Segment</th>
                        <th className="py-2.5 px-3">Customers</th>
                        <th className="py-2.5 px-3">Paid Orders</th>
                        <th className="py-2.5 px-3">Net Revenue</th>
                        <th className="py-2.5 px-3">AOV</th>
                        <th className="py-2.5 pl-3">Repeat Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#123B2A]/60">
                      {(dashboard.segments?.segments || []).map((s: any) => (
                        <tr key={s.segmentKey}>
                          <td className="py-3 pr-4 font-bold text-white">{s.name}</td>
                          <td className="py-3 px-3">{s.customerCount}</td>
                          <td className="py-3 px-3">{s.qualifyingPaidOrders}</td>
                          <td className="py-3 px-3 font-bold text-[#C6A15B]">
                            {formatInr(s.netRevenue)}
                          </td>
                          <td className="py-3 px-3">{formatInr(s.aov)}</td>
                          <td className="py-3 pl-3">{s.repeatPurchaseRatePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COUPONS, LOYALTY, REFERRALS, WISHLIST & REVIEWS */}
          {activeTab === 'programs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Coupon vs Non-Coupon Orders (Observational)
                </h2>
                <p className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/50 p-3 rounded-lg">
                  {dashboard.coupons?.causalityDisclaimer}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="font-bold text-[#C6A15B]">Coupon Orders</div>
                    <div className="mt-2 space-y-1 text-stone-300">
                      <div>Orders: {dashboard.coupons?.couponUsersSummary?.ordersCount ?? 0}</div>
                      <div>
                        Net Revenue:{' '}
                        {formatInr(dashboard.coupons?.couponUsersSummary?.netRevenue)}
                      </div>
                      <div>AOV: {formatInr(dashboard.coupons?.couponUsersSummary?.aov)}</div>
                      <div>
                        Repeat Rate:{' '}
                        {dashboard.coupons?.couponUsersSummary?.repeatPurchaseRatePercent ?? 0}%
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="font-bold text-stone-200">Non-Coupon Orders</div>
                    <div className="mt-2 space-y-1 text-stone-300">
                      <div>
                        Orders: {dashboard.coupons?.nonCouponUsersSummary?.ordersCount ?? 0}
                      </div>
                      <div>
                        Net Revenue:{' '}
                        {formatInr(dashboard.coupons?.nonCouponUsersSummary?.netRevenue)}
                      </div>
                      <div>AOV: {formatInr(dashboard.coupons?.nonCouponUsersSummary?.aov)}</div>
                      <div>
                        Repeat Rate:{' '}
                        {dashboard.coupons?.nonCouponUsersSummary?.repeatPurchaseRatePercent ?? 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
                <h2 className="text-base font-bold text-white">
                  Loyalty, Referrals, Wishlist & Reviews
                </h2>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="font-bold text-[#C6A15B]">Loyalty Ledger</div>
                    <div className="mt-1.5 space-y-1 text-stone-300">
                      <div>
                        Earned: {dashboard.retentionMechanisms?.loyalty?.pointsEarned ?? 0} pts
                      </div>
                      <div>
                        Redeemed: {dashboard.retentionMechanisms?.loyalty?.pointsRedeemed ?? 0} pts
                      </div>
                      <div>
                        Reversed: {dashboard.retentionMechanisms?.loyalty?.pointsReversed ?? 0} pts
                      </div>
                      <div>
                        Associated Revenue:{' '}
                        {formatInr(
                          dashboard.retentionMechanisms?.loyalty?.revenueAssociatedWithLoyalty
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="font-bold text-emerald-400">Referral Program</div>
                    <div className="mt-1.5 space-y-1 text-stone-300">
                      <div>
                        Codes Created:{' '}
                        {dashboard.retentionMechanisms?.referrals?.referralCodesCreatedCount ?? 0}
                      </div>
                      <div>
                        Successful:{' '}
                        {dashboard.retentionMechanisms?.referrals?.successfulReferralsCount ?? 0}
                      </div>
                      <div>
                        Referral Orders:{' '}
                        {dashboard.retentionMechanisms?.referrals?.referralOrdersCount ?? 0}
                      </div>
                      <div>
                        Net Revenue:{' '}
                        {formatInr(dashboard.retentionMechanisms?.referrals?.referralNetRevenue)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="font-bold text-white">Wishlist Funnel</div>
                    <div className="mt-1.5 space-y-1 text-stone-300">
                      <div>
                        Wishlisted Items:{' '}
                        {dashboard.retentionMechanisms?.wishlist?.currentWishlistedItemsCount ?? 0}
                      </div>
                      <div>
                        Wishlist → Cart:{' '}
                        {dashboard.retentionMechanisms?.wishlist?.wishlistToCartCount ?? 0}
                      </div>
                      <div>
                        Wishlist → Paid Order:{' '}
                        {dashboard.retentionMechanisms?.wishlist?.wishlistToPurchaseCount ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#061912] border border-[#123B2A]">
                    <div className="font-bold text-amber-300">Verified Reviews</div>
                    <div className="mt-1.5 space-y-1 text-stone-300">
                      <div>
                        Submissions:{' '}
                        {dashboard.retentionMechanisms?.reviews?.totalSubmissions ?? 0} (Approved:{' '}
                        {dashboard.retentionMechanisms?.reviews?.approvedReviews ?? 0})
                      </div>
                      <div>
                        Avg Rating:{' '}
                        {dashboard.retentionMechanisms?.reviews?.averageRating ?? 'N/A'} ★
                      </div>
                      <div>
                        Verified Purchases:{' '}
                        {dashboard.retentionMechanisms?.reviews?.verifiedPurchaseReviews ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AdminGrowthAnalytics;

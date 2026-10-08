// src/pages/admin/AdminAnalytics.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Users,
  RotateCcw,
  TicketPercent,
  Boxes,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Info,
  ShoppingCart,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type {
  AnalyticsRangePreset,
  AnalyticsGranularity,
  AnalyticsSummaryResponse,
  AnalyticsRevenueResponse,
  AnalyticsOrdersResponse,
  AnalyticsPaymentsResponse,
  AnalyticsRefundsResponse,
  AnalyticsProductsResponse,
  AnalyticsCustomersResponse,
  AnalyticsCouponsResponse,
} from '../../types/admin';

const RANGE_PRESETS: Array<{ value: AnalyticsRangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'previous_month', label: 'Previous Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

function formatInr(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-IN');
}

function formatPercent(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0%';
  return `${num.toFixed(num % 1 === 0 ? 0 : 2)}%`;
}

export const AdminAnalytics: React.FC = () => {
  // Date range & granularity controls
  const [range, setRange] = useState<AnalyticsRangePreset>('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('auto');

  // Core overview states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [revenueData, setRevenueData] = useState<AnalyticsRevenueResponse | null>(null);
  const [ordersData, setOrdersData] = useState<AnalyticsOrdersResponse | null>(null);
  const [paymentsData, setPaymentsData] = useState<AnalyticsPaymentsResponse | null>(null);
  const [refundsData, setRefundsData] = useState<AnalyticsRefundsResponse | null>(null);

  // Active tab for detailed tables ('products' | 'customers' | 'coupons')
  const [activeTableTab, setActiveTableTab] = useState<'products' | 'customers' | 'coupons'>('products');
  const [topProductsRankBy, setTopProductsRankBy] = useState<'revenue' | 'units'>('revenue');

  // Product table states
  const [productsData, setProductsData] = useState<AnalyticsProductsResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSortBy, setProductSortBy] = useState<'revenue' | 'unitsSold' | 'orders' | 'stock'>('revenue');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('desc');
  const [productPerformanceFilter, setProductPerformanceFilter] = useState<'all' | 'top' | 'low'>('all');

  // Customer table states
  const [customersData, setCustomersData] = useState<AnalyticsCustomersResponse | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');

  // Coupon table states
  const [couponsData, setCouponsData] = useState<AnalyticsCouponsResponse | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [couponPage, setCouponPage] = useState(1);
  const [couponSearch, setCouponSearch] = useState('');

  const buildDateParams = useCallback(() => {
    if (range === 'custom') {
      return {
        range: 'custom' as const,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        granularity,
      };
    }
    return {
      range,
      granularity,
    };
  }, [range, startDate, endDate, granularity]);

  const fetchOverviewAnalytics = useCallback(async () => {
    if (range === 'custom' && (!startDate || !endDate)) {
      return;
    }
    setLoadingOverview(true);
    setOverviewError(null);
    const params = buildDateParams();

    try {
      const [sumRes, revRes, ordRes, payRes, refRes] = await Promise.all([
        adminService.getAnalyticsSummary(params),
        adminService.getAnalyticsRevenue(params),
        adminService.getAnalyticsOrders(params),
        adminService.getAnalyticsPayments(params),
        adminService.getAnalyticsRefunds(params),
      ]);
      setSummary(sumRes);
      setRevenueData(revRes);
      setOrdersData(ordRes);
      setPaymentsData(payRes);
      setRefundsData(refRes);
    } catch (err: any) {
      setOverviewError(err?.message || 'Failed to load analytics overview.');
    } finally {
      setLoadingOverview(false);
    }
  }, [range, startDate, endDate, buildDateParams]);

  const fetchProductsTable = useCallback(async () => {
    if (range === 'custom' && (!startDate || !endDate)) return;
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const res = await adminService.getAnalyticsProducts({
        ...buildDateParams(),
        page: productPage,
        limit: 10,
        search: productSearch.trim() || undefined,
        category: productCategory || undefined,
        sortBy: productSortBy,
        sortOrder: productSortOrder,
        performance: productPerformanceFilter,
      });
      setProductsData(res);
    } catch (err: any) {
      setProductsError(err?.message || 'Failed to load product analytics.');
    } finally {
      setLoadingProducts(false);
    }
  }, [
    range,
    startDate,
    endDate,
    buildDateParams,
    productPage,
    productSearch,
    productCategory,
    productSortBy,
    productSortOrder,
    productPerformanceFilter,
  ]);

  const fetchCustomersTable = useCallback(async () => {
    if (range === 'custom' && (!startDate || !endDate)) return;
    setLoadingCustomers(true);
    setCustomersError(null);
    try {
      const res = await adminService.getAnalyticsCustomers({
        ...buildDateParams(),
        page: customerPage,
        limit: 10,
        search: customerSearch.trim() || undefined,
      });
      setCustomersData(res);
    } catch (err: any) {
      setCustomersError(err?.message || 'Failed to load customer analytics.');
    } finally {
      setLoadingCustomers(false);
    }
  }, [range, startDate, endDate, buildDateParams, customerPage, customerSearch]);

  const fetchCouponsTable = useCallback(async () => {
    if (range === 'custom' && (!startDate || !endDate)) return;
    setLoadingCoupons(true);
    setCouponsError(null);
    try {
      const res = await adminService.getAnalyticsCoupons({
        ...buildDateParams(),
        page: couponPage,
        limit: 10,
        search: couponSearch.trim() || undefined,
      });
      setCouponsData(res);
    } catch (err: any) {
      setCouponsError(err?.message || 'Failed to load coupon analytics.');
    } finally {
      setLoadingCoupons(false);
    }
  }, [range, startDate, endDate, buildDateParams, couponPage, couponSearch]);

  useEffect(() => {
    fetchOverviewAnalytics();
  }, [fetchOverviewAnalytics]);

  useEffect(() => {
    fetchProductsTable();
  }, [fetchProductsTable]);

  useEffect(() => {
    fetchCustomersTable();
  }, [fetchCustomersTable]);

  useEffect(() => {
    fetchCouponsTable();
  }, [fetchCouponsTable]);

  const handleRefreshAll = () => {
    fetchOverviewAnalytics();
    fetchProductsTable();
    fetchCustomersTable();
    fetchCouponsTable();
  };

  const kpis = summary?.kpis;
  const revSeries = revenueData?.series || [];
  const maxGrossInSeries = Math.max(
    1,
    ...revSeries.map((pt) => Math.max(pt.grossSalesRupees || 0, pt.netRevenueRupees || 0))
  );

  const ordSeries = ordersData?.trend || [];
  const maxOrdersInSeries = Math.max(1, ...ordSeries.map((pt) => pt.totalOrders || 0));

  const topProductsList =
    topProductsRankBy === 'revenue'
      ? productsData?.topByRevenue || []
      : productsData?.topByUnits || [];
  const maxTopProductMetric = Math.max(
    1,
    ...topProductsList.map((p) =>
      topProductsRankBy === 'revenue' ? p.grossRevenueRupees : p.unitsSold
    )
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#C6A15B] uppercase">
              BUSINESS INTELLIGENCE
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#123B2A]/10 text-[#123B2A] font-mono text-[10px] font-bold">
              Asia/Kolkata (IST, UTC+05:30)
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A] mt-0.5">
            Analytics & Financial Intelligence
          </h1>
          <p className="text-sm text-[#68756E] mt-1">
            Server-authoritative revenue, order lifecycle, customer retention, product velocity, and coupon attribution.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={loadingOverview}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8DECB] text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:border-[#C6A15B] transition-all self-start lg:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingOverview ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Date Range & Granularity Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DECB] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setRange(preset.value);
                  setProductPage(1);
                  setCustomerPage(1);
                  setCouponPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  range === preset.value
                    ? 'bg-[#123B2A] text-[#C6A15B] shadow-xs'
                    : 'bg-[#FCFAF5] text-[#1C1C1C] border border-[#E8DECB] hover:border-[#123B2A]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C6A15B]" />
            <label className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
              Bucket:
            </label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as AnalyticsGranularity)}
              aria-label="Select chart bucket granularity"
              className="px-3 py-1.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#123B2A] focus:outline-none focus:border-[#123B2A]"
            >
              <option value="auto">Auto ({summary?.meta?.granularity || 'daily'})</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E8DECB]/70">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
                Start Date (IST):
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
                End Date (IST):
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
              />
            </div>
          </div>
        )}

        {summary?.meta && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#68756E] pt-2 border-t border-[#E8DECB]/50">
            <span>
              Active Window: <strong className="text-[#123B2A]">{summary.meta.startDate}</strong> to{' '}
              <strong className="text-[#123B2A]">{summary.meta.endDate}</strong> ({summary.meta.dayCount}{' '}
              {summary.meta.dayCount === 1 ? 'day' : 'days'})
            </span>
            <span>
              Rule: Gross Sales = Captured/Paid Orders • Net Revenue = Gross Sales − Verified Refunds
            </span>
          </div>
        )}
      </div>

      {/* Explicit Error Banner if Overview Fails */}
      {overviewError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{overviewError}</span>
          </div>
          <button
            type="button"
            onClick={fetchOverviewAnalytics}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary 8 KPI Cards */}
      {!overviewError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Net Revenue */}
          <div className="bg-[#123B2A] text-white rounded-2xl p-5 border border-[#C6A15B]/30 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C6A15B]">
                Net Revenue
              </span>
              <TrendingUp className="w-4 h-4 text-[#C6A15B]" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#FCFAF5] mt-2">
              {loadingOverview ? '—' : formatInr(kpis?.netRevenueRupees)}
            </p>
            <span className="text-xs text-[#E8DECB]/80 mt-1 block">
              Gross Sales minus Verified Refunds
            </span>
          </div>

          {/* 2. Gross Sales */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Gross Sales
              </span>
              <BarChart3 className="w-4 h-4 text-[#123B2A]" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#123B2A] mt-2">
              {loadingOverview ? '—' : formatInr(kpis?.grossSalesRupees)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `Across ${formatNumber(kpis?.qualifyingOrdersCount)} paid orders`}
            </span>
          </div>

          {/* 3. Orders */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Orders Placed
              </span>
              <ShoppingBag className="w-4 h-4 text-[#C6A15B]" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#123B2A] mt-2">
              {loadingOverview ? '—' : formatNumber(kpis?.totalOrders)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `${formatNumber(kpis?.qualifyingOrdersCount)} paid • ${formatNumber(
                    summary?.ordersByStatus?.CANCELLED
                  )} cancelled`}
            </span>
          </div>

          {/* 4. Average Order Value */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Average Order Value
              </span>
              <CreditCard className="w-4 h-4 text-[#123B2A]" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#123B2A] mt-2">
              {loadingOverview ? '—' : formatInr(kpis?.averageOrderValueRupees)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `${formatNumber(kpis?.unitsSold)} total units sold`}
            </span>
          </div>

          {/* 5. Refunded Amount */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Refunded Amount
              </span>
              <RotateCcw className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-red-700 mt-2">
              {loadingOverview ? '—' : formatInr(kpis?.refundedAmountRupees)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `${formatNumber(kpis?.refundedOrdersCount)} refunded orders`}
            </span>
          </div>

          {/* 6. Refund Rate */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Refund Rate
              </span>
              <RotateCcw className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#123B2A] mt-2">
              {loadingOverview ? '—' : formatPercent(kpis?.refundRatePercent)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `${formatPercent(kpis?.refundVolumeRatePercent)} of gross revenue`}
            </span>
          </div>

          {/* 7. Customers */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Active Buyers
              </span>
              <Users className="w-4 h-4 text-[#123B2A]" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#123B2A] mt-2">
              {loadingOverview ? '—' : formatNumber(kpis?.activeBuyingCustomers)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `${formatNumber(kpis?.newCustomers)} first-time buyers in period`}
            </span>
          </div>

          {/* 8. Returning Customers */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
                Returning Customers
              </span>
              <Users className="w-4 h-4 text-[#C6A15B]" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-[#123B2A] mt-2">
              {loadingOverview ? '—' : formatNumber(kpis?.returningCustomers)}
            </p>
            <span className="text-xs text-[#68756E] mt-1 block">
              {loadingOverview
                ? 'Loading...'
                : `${formatPercent(kpis?.repeatPurchaseRatePercent)} repeat purchase rate`}
            </span>
          </div>
        </div>
      )}

      {/* Secondary Operational Intelligence Strip: Coupons, Inventory & Carts */}
      {!overviewError && summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FCFAF5] rounded-2xl p-4 border border-[#E8DECB] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#68756E] block">
                COUPON DISCOUNTS GIVEN
              </span>
              <p className="text-lg font-serif font-bold text-[#123B2A] mt-0.5">
                {formatInr(kpis?.couponDiscountRupees)}
              </p>
              <span className="text-xs text-[#68756E]">
                Applied across {formatNumber(kpis?.couponOrdersCount)} paid orders
              </span>
            </div>
            <TicketPercent className="w-7 h-7 text-[#C6A15B]" />
          </div>

          <div className="bg-[#FCFAF5] rounded-2xl p-4 border border-[#E8DECB] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#68756E] block">
                INVENTORY VALUATION & ALERTS
              </span>
              <p className="text-lg font-serif font-bold text-[#123B2A] mt-0.5">
                {formatInr(summary.inventory.estimatedStockValueRupees)}{' '}
                <span className="text-xs font-sans font-normal text-[#68756E]">
                  ({formatNumber(summary.inventory.totalStockUnits)} units)
                </span>
              </p>
              <span className="text-xs text-[#68756E]">
                {summary.inventory.outOfStockProducts} out-of-stock •{' '}
                {summary.inventory.lowStockProducts} low-stock SKUs
              </span>
            </div>
            <Boxes className="w-7 h-7 text-[#123B2A]" />
          </div>

          <div className="bg-[#FCFAF5] rounded-2xl p-4 border border-[#E8DECB] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#68756E] block">
                ACTIVE CUSTOMER CARTS
              </span>
              <p className="text-lg font-serif font-bold text-[#123B2A] mt-0.5">
                {formatNumber(summary.carts.cartsWithItems)} active carts (
                {formatInr(summary.carts.activeCartValueRupees)})
              </p>
              <span className="text-[11px] text-[#68756E] block">
                {summary.carts.note}
              </span>
            </div>
            <ShoppingCart className="w-7 h-7 text-[#C6A15B]" />
          </div>
        </div>
      )}

      {/* Charts Grid Row 1: Revenue Trend & Orders Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trend (Gross Sales, Refunds, Net Revenue) */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                FINANCIAL TRAJECTORY
              </span>
              <h2 className="font-serif text-lg font-bold text-[#123B2A]">
                Revenue Trend (Gross vs Net vs Refunds)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#123B2A] font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#123B2A]" /> Net Revenue
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#C6A15B] font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#C6A15B]" /> Gross Sales
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-500" /> Refunds
              </span>
            </div>
          </div>

          {loadingOverview ? (
            <div className="h-56 flex items-center justify-center text-sm text-[#68756E]">
              Loading revenue series...
            </div>
          ) : revSeries.length === 0 || revenueData?.totals.grossSalesPaise === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center bg-[#FCFAF5] rounded-xl border border-dashed border-[#E8DECB] p-6">
              <BarChart3 className="w-8 h-8 text-[#C6A15B] mb-2" />
              <p className="text-sm font-bold text-[#123B2A]">
                No realized revenue in selected period
              </p>
              <p className="text-xs text-[#68756E] mt-1">
                Gross Sales: ₹0 • Refunds: ₹0 • Net Revenue: ₹0
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-52 flex items-end gap-1.5 pt-4 pb-2 px-2 bg-[#FCFAF5] rounded-xl border border-[#E8DECB]/70 overflow-x-auto">
                {revSeries.map((pt) => {
                  const grossPct = Math.max(
                    pt.grossSalesRupees > 0 ? 4 : 0,
                    Math.round((pt.grossSalesRupees / maxGrossInSeries) * 100)
                  );
                  const netPct = Math.max(
                    pt.netRevenueRupees > 0 ? 4 : 0,
                    Math.round((pt.netRevenueRupees / maxGrossInSeries) * 100)
                  );
                  const refPct = Math.max(
                    pt.refundsRupees > 0 ? 4 : 0,
                    Math.round((pt.refundsRupees / maxGrossInSeries) * 100)
                  );
                  return (
                    <div
                      key={pt.date}
                      className="flex-1 min-w-[26px] h-full flex flex-col justify-end items-center group relative"
                      title={`${pt.date}\nGross: ${formatInr(pt.grossSalesRupees)}\nRefunds: ${formatInr(pt.refundsRupees)}\nNet: ${formatInr(pt.netRevenueRupees)}`}
                    >
                      <div className="w-full flex items-end justify-center gap-0.5 h-[85%]">
                        <div
                          style={{ height: `${grossPct}%` }}
                          className="w-2 bg-[#C6A15B]/75 rounded-t-xs transition-all"
                        />
                        <div
                          style={{ height: `${netPct}%` }}
                          className="w-2.5 bg-[#123B2A] rounded-t-xs transition-all"
                        />
                        {pt.refundsRupees > 0 && (
                          <div
                            style={{ height: `${refPct}%` }}
                            className="w-1.5 bg-red-500 rounded-t-xs transition-all"
                          />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[#68756E] mt-1 truncate max-w-[44px]">
                        {pt.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-[#68756E] px-1">
                <span>Period Gross: <strong className="text-[#123B2A]">{formatInr(revenueData?.totals.grossSalesRupees)}</strong></span>
                <span>Period Refunds: <strong className="text-red-700">{formatInr(revenueData?.totals.refundsRupees)}</strong></span>
                <span>Period Net: <strong className="text-emerald-800">{formatInr(revenueData?.totals.netRevenueRupees)}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Orders Trend Over Time */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                ORDER VELOCITY
              </span>
              <h2 className="font-serif text-lg font-bold text-[#123B2A]">
                Orders Trend Over Time
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[#123B2A] font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#123B2A]" /> Paid Orders
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#68756E] font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#E8DECB]" /> Total Placed
              </span>
            </div>
          </div>

          {loadingOverview ? (
            <div className="h-56 flex items-center justify-center text-sm text-[#68756E]">
              Loading order trend...
            </div>
          ) : ordSeries.length === 0 || ordersData?.totals.totalOrders === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center bg-[#FCFAF5] rounded-xl border border-dashed border-[#E8DECB] p-6">
              <ShoppingBag className="w-8 h-8 text-[#C6A15B] mb-2" />
              <p className="text-sm font-bold text-[#123B2A]">No orders placed in selected period</p>
              <p className="text-xs text-[#68756E] mt-1">
                Try expanding the date range filter above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-52 flex items-end gap-1.5 pt-4 pb-2 px-2 bg-[#FCFAF5] rounded-xl border border-[#E8DECB]/70 overflow-x-auto">
                {ordSeries.map((pt) => {
                  const totalPct = Math.max(
                    pt.totalOrders > 0 ? 5 : 0,
                    Math.round((pt.totalOrders / maxOrdersInSeries) * 100)
                  );
                  const qualPct = Math.max(
                    pt.qualifyingOrders > 0 ? 5 : 0,
                    Math.round((pt.qualifyingOrders / maxOrdersInSeries) * 100)
                  );
                  return (
                    <div
                      key={pt.date}
                      className="flex-1 min-w-[26px] h-full flex flex-col justify-end items-center"
                      title={`${pt.date}\nTotal Orders: ${pt.totalOrders}\nQualifying Paid: ${pt.qualifyingOrders}\nDelivered: ${pt.deliveredOrders}\nCancelled: ${pt.cancelledOrders}`}
                    >
                      <div className="w-full flex items-end justify-center gap-0.5 h-[85%]">
                        <div
                          style={{ height: `${totalPct}%` }}
                          className="w-2 bg-[#D5C7B2] rounded-t-xs"
                        />
                        <div
                          style={{ height: `${qualPct}%` }}
                          className="w-2.5 bg-[#123B2A] rounded-t-xs"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-[#68756E] mt-1 truncate max-w-[44px]">
                        {pt.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-[#68756E] px-1">
                <span>Total Orders: <strong className="text-[#123B2A]">{formatNumber(ordersData?.totals.totalOrders)}</strong></span>
                <span>Delivered: <strong className="text-emerald-700">{formatNumber(ordersData?.totals.deliveredOrders)}</strong></span>
                <span>Cancelled: <strong className="text-red-700">{formatNumber(ordersData?.totals.cancelledOrders)}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid Row 2: Order Status Distribution & Payment Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Order Status Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
            FULFILLMENT PIPELINE
          </span>
          <h2 className="font-serif text-lg font-bold text-[#123B2A] mb-4">
            Order Status Distribution
          </h2>

          {ordersData && ordersData.statusDistribution.length > 0 ? (
            <div className="space-y-3">
              {ordersData.statusDistribution.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1C1C1C]">{item.status}</span>
                    <span className="font-mono text-[#68756E]">
                      {formatNumber(item.count)} ({formatPercent(item.percentage)})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#FCFAF5] rounded-full overflow-hidden border border-[#E8DECB]">
                    <div
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                      className={`h-full rounded-full ${
                        item.status === 'DELIVERED'
                          ? 'bg-emerald-600'
                          : item.status === 'CANCELLED'
                          ? 'bg-red-500'
                          : item.status === 'PENDING'
                          ? 'bg-amber-500'
                          : 'bg-[#123B2A]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#68756E] py-8 text-center">No order status data available.</p>
          )}
        </div>

        {/* Chart 4: Payment Status Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                GATEWAY TELEMETRY
              </span>
              <h2 className="font-serif text-lg font-bold text-[#123B2A]">
                Payment Status Breakdown
              </h2>
            </div>
            {paymentsData && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                Capture Rate: {formatPercent(paymentsData.totals.paymentSuccessRatePercent)}
              </span>
            )}
          </div>

          {paymentsData && paymentsData.statusBreakdown.length > 0 ? (
            <div className="space-y-3">
              {paymentsData.statusBreakdown.map((p) => (
                <div key={p.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1C1C1C]">{p.status}</span>
                    <span className="font-mono text-[#68756E]">
                      {formatNumber(p.count)} txns • {formatInr(p.amountRupees)} (
                      {formatPercent(p.percentage)})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#FCFAF5] rounded-full overflow-hidden border border-[#E8DECB]">
                    <div
                      style={{ width: `${Math.min(100, p.percentage)}%` }}
                      className={`h-full rounded-full ${
                        p.status === 'CAPTURED'
                          ? 'bg-emerald-600'
                          : p.status === 'FAILED'
                          ? 'bg-red-500'
                          : p.status === 'REFUNDED'
                          ? 'bg-purple-600'
                          : 'bg-[#C6A15B]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#68756E] py-8 text-center">No payment transactions in period.</p>
          )}
        </div>
      </div>

      {/* Charts Grid Row 3: Top Products Horizontal Bar, Category Performance, & Refund Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 5: Top Products Horizontal Bar */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                PRODUCT LEADERBOARD
              </span>
              <h2 className="font-serif text-lg font-bold text-[#123B2A]">
                Top Performing Products
              </h2>
            </div>
            <div className="flex rounded-lg border border-[#E8DECB] overflow-hidden text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTopProductsRankBy('revenue')}
                className={`px-2.5 py-1 ${
                  topProductsRankBy === 'revenue'
                    ? 'bg-[#123B2A] text-[#C6A15B]'
                    : 'bg-[#FCFAF5] text-[#68756E]'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setTopProductsRankBy('units')}
                className={`px-2.5 py-1 ${
                  topProductsRankBy === 'units'
                    ? 'bg-[#123B2A] text-[#C6A15B]'
                    : 'bg-[#FCFAF5] text-[#68756E]'
                }`}
              >
                Units
              </button>
            </div>
          </div>

          {topProductsList.length === 0 ? (
            <p className="text-sm text-[#68756E] py-8 text-center">No product sales in period.</p>
          ) : (
            <div className="space-y-3">
              {topProductsList.map((prod) => {
                const metricVal =
                  topProductsRankBy === 'revenue' ? prod.grossRevenueRupees : prod.unitsSold;
                const widthPct = Math.round((metricVal / maxTopProductMetric) * 100);
                return (
                  <div key={prod.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-[#1C1C1C] truncate">{prod.name}</span>
                      <span className="font-mono text-[#123B2A] shrink-0 font-bold">
                        {topProductsRankBy === 'revenue'
                          ? formatInr(prod.grossRevenueRupees)
                          : `${formatNumber(prod.unitsSold)} units`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FCFAF5] rounded-full overflow-hidden border border-[#E8DECB]">
                      <div
                        style={{ width: `${Math.min(100, Math.max(metricVal > 0 ? 4 : 0, widthPct))}%` }}
                        className="h-full bg-[#123B2A] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 6: Category Performance */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
            CATALOG MIX
          </span>
          <h2 className="font-serif text-lg font-bold text-[#123B2A] mb-4">
            Sales by Product Category
          </h2>

          {productsData && productsData.categories.length > 0 ? (
            <div className="space-y-3.5">
              {productsData.categories.map((cat) => (
                <div key={cat.category} className="p-3 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#123B2A] uppercase tracking-wider">
                      {cat.category}
                    </span>
                    <span className="font-mono font-bold text-[#C6A15B]">
                      {formatPercent(cat.percentageContribution)} share
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#68756E] mt-1">
                    <span>{formatNumber(cat.unitsSold)} units sold</span>
                    <span className="font-bold text-[#1C1C1C]">{formatInr(cat.revenueRupees)}</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E8DECB] mt-2">
                    <div
                      style={{ width: `${Math.min(100, cat.percentageContribution)}%` }}
                      className="h-full bg-[#C6A15B] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#68756E] py-8 text-center">No category data available.</p>
          )}
        </div>

        {/* Chart 7: Refund Analytics & Reasons */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
            REVENUE LEAKAGE
          </span>
          <h2 className="font-serif text-lg font-bold text-[#123B2A] mb-4">
            Refund Reasons & Impact
          </h2>

          {refundsData && refundsData.totals.refundedOrdersCount > 0 ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 flex items-center justify-between text-xs">
                <span className="font-bold text-red-900">
                  {refundsData.totals.refundedOrdersCount} Refunded Orders
                </span>
                <span className="font-mono font-bold text-red-700">
                  {formatInr(refundsData.totals.refundAmountRupees)} (
                  {formatPercent(refundsData.totals.refundRatePercent)})
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {refundsData.byReason.map((r) => (
                  <div
                    key={r.reason}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#FCFAF5] border border-[#E8DECB]"
                  >
                    <span className="font-medium text-[#1C1C1C] truncate max-w-[180px]">
                      {r.reason}
                    </span>
                    <span className="font-mono text-[#68756E] shrink-0">
                      {r.count}x • <strong className="text-red-700">{formatInr(r.amountRupees)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center bg-[#FCFAF5] rounded-xl border border-dashed border-[#E8DECB] p-4">
              <Info className="w-6 h-6 text-emerald-700 mb-1.5" />
              <p className="text-sm font-bold text-[#123B2A]">Zero Refunds in Period</p>
              <p className="text-xs text-[#68756E] mt-0.5">
                100% of gross sales retained as net revenue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analytics Tables Section (Products | Customers | Coupons) */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-xs overflow-hidden">
        {/* Table Navigation Tabs */}
        <div className="px-5 pt-4 bg-[#FCFAF5] border-b border-[#E8DECB] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTableTab('products')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                activeTableTab === 'products'
                  ? 'border-[#123B2A] text-[#123B2A] bg-white'
                  : 'border-transparent text-[#68756E] hover:text-[#123B2A]'
              }`}
            >
              Product Performance
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('customers')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                activeTableTab === 'customers'
                  ? 'border-[#123B2A] text-[#123B2A] bg-white'
                  : 'border-transparent text-[#68756E] hover:text-[#123B2A]'
              }`}
            >
              Customer Retention & Spend
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('coupons')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                activeTableTab === 'coupons'
                  ? 'border-[#123B2A] text-[#123B2A] bg-white'
                  : 'border-transparent text-[#68756E] hover:text-[#123B2A]'
              }`}
            >
              Coupon Effectiveness
            </button>
          </div>
        </div>

        {/* TAB 1: PRODUCT PERFORMANCE TABLE */}
        {activeTableTab === 'products' && (
          <div>
            <div className="p-4 border-b border-[#E8DECB] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  placeholder="Search product name, SKU, category..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={productPerformanceFilter}
                  onChange={(e) => {
                    setProductPerformanceFilter(e.target.value as 'all' | 'top' | 'low');
                    setProductPage(1);
                  }}
                  aria-label="Filter product performance tier"
                  className="px-3 py-2 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#123B2A]"
                >
                  <option value="all">All Catalog Products</option>
                  <option value="top">Selling Products Only</option>
                  <option value="low">Lowest-Performing First</option>
                </select>

                <select
                  value={productCategory}
                  onChange={(e) => {
                    setProductCategory(e.target.value);
                    setProductPage(1);
                  }}
                  aria-label="Filter by product category"
                  className="px-3 py-2 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#123B2A]"
                >
                  <option value="">All Categories</option>
                  {productsData?.categories.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.category}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (productSortBy === 'revenue') {
                      setProductSortBy('unitsSold');
                    } else {
                      setProductSortBy('revenue');
                    }
                    setProductSortOrder('desc');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#123B2A]"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort: {productSortBy === 'revenue' ? 'Revenue' : 'Units Sold'}
                </button>
              </div>
            </div>

            {productsError ? (
              <div className="p-6 text-center text-red-700 text-sm">{productsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FCFAF5] border-b border-[#E8DECB] text-[11px] font-extrabold uppercase tracking-wider text-[#68756E]">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-right">Units Sold</th>
                      <th className="py-3.5 px-4 text-right">Orders</th>
                      <th className="py-3.5 px-4 text-right">Avg Price</th>
                      <th className="py-3.5 px-4 text-right">Gross Revenue</th>
                      <th className="py-3.5 px-4 text-right">Net Revenue</th>
                      <th className="py-3.5 px-4 text-center">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB]/60 text-sm">
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-[#68756E]">
                          Loading product analytics...
                        </td>
                      </tr>
                    ) : !productsData || productsData.products.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-[#68756E]">
                          No products match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      productsData.products.map((p) => (
                        <tr key={p.productId} className="hover:bg-[#FCFAF5]/70">
                          <td className="py-3.5 px-4 font-bold text-[#123B2A]">{p.name}</td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[#68756E]">
                            {p.sku || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#1C1C1C]">{p.category}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1C1C1C]">
                            {formatNumber(p.unitsSold)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#68756E]">
                            {formatNumber(p.ordersCount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#68756E]">
                            {formatInr(p.averageSellingPriceRupees)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#123B2A]">
                            {formatInr(p.grossRevenueRupees)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                            {formatInr(p.netRevenueRupees)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                p.stockStatus === 'OUT_OF_STOCK'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : p.stockStatus === 'LOW_STOCK'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {formatNumber(p.stock)} in stock
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {productsData && (
              <div className="px-4 py-3 bg-[#FCFAF5] border-t border-[#E8DECB] flex items-center justify-between text-xs text-[#68756E]">
                <span>
                  Page <strong>{productsData.pagination.page}</strong> of{' '}
                  <strong>{productsData.pagination.totalPages}</strong> (
                  {productsData.pagination.total} products)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#E8DECB] bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={productPage >= productsData.pagination.totalPages}
                    onClick={() =>
                      setProductPage((p) => Math.min(productsData.pagination.totalPages, p + 1))
                    }
                    className="p-1.5 rounded-lg border border-[#E8DECB] bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CUSTOMER PERFORMANCE & RETENTION TABLE */}
        {activeTableTab === 'customers' && (
          <div>
            <div className="p-4 border-b border-[#E8DECB] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomerPage(1);
                  }}
                  placeholder="Search customer name or email..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
                />
              </div>

              {customersData && (
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#68756E]">
                  <span>
                    Avg Customer Spend:{' '}
                    <strong className="text-[#123B2A]">
                      {formatInr(customersData.totals.averageCustomerSpendRupees)}
                    </strong>
                  </span>
                  <span>
                    Avg Orders / Buyer:{' '}
                    <strong className="text-[#123B2A]">
                      {customersData.totals.averageOrdersPerCustomer}
                    </strong>
                  </span>
                  <span>
                    Lifetime Repeat Rate:{' '}
                    <strong className="text-emerald-700">
                      {formatPercent(customersData.totals.lifetimeRepeatPurchaseRatePercent)}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {customersError ? (
              <div className="p-6 text-center text-red-700 text-sm">{customersError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FCFAF5] border-b border-[#E8DECB] text-[11px] font-extrabold uppercase tracking-wider text-[#68756E]">
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4 text-center">Customer Type</th>
                      <th className="py-3.5 px-4 text-right">Orders (Period)</th>
                      <th className="py-3.5 px-4 text-right">Lifetime Orders</th>
                      <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                      <th className="py-3.5 px-4 text-right">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB]/60 text-sm">
                    {loadingCustomers ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#68756E]">
                          Loading customer analytics...
                        </td>
                      </tr>
                    ) : !customersData || customersData.topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#68756E]">
                          No qualifying customer orders found.
                        </td>
                      </tr>
                    ) : (
                      customersData.topCustomers.map((c) => (
                        <tr key={c.customerId} className="hover:bg-[#FCFAF5]/70">
                          <td className="py-3.5 px-4">
                            <Link
                              to={`/admin/customers/${c.customerId}`}
                              className="font-bold text-[#123B2A] hover:text-[#C6A15B]"
                            >
                              {c.name}
                            </Link>
                            <div className="text-xs text-[#68756E]">{c.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                                c.customerType === 'RETURNING'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {c.customerType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#1C1C1C]">
                            {formatNumber(c.periodOrdersCount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1C1C1C]">
                            {formatNumber(c.ordersCount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#123B2A]">
                            {formatInr(c.lifetimeSpendRupees)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-[#68756E]">
                            {new Date(c.lastOrderAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {customersData && (
              <div className="px-4 py-3 bg-[#FCFAF5] border-t border-[#E8DECB] flex items-center justify-between text-xs text-[#68756E]">
                <span>
                  Page <strong>{customersData.pagination.page}</strong> of{' '}
                  <strong>{customersData.pagination.totalPages}</strong> (
                  {customersData.pagination.total} buying customers)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={customerPage <= 1}
                    onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#E8DECB] bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={customerPage >= customersData.pagination.totalPages}
                    onClick={() =>
                      setCustomerPage((p) => Math.min(customersData.pagination.totalPages, p + 1))
                    }
                    className="p-1.5 rounded-lg border border-[#E8DECB] bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COUPON EFFECTIVENESS TABLE */}
        {activeTableTab === 'coupons' && (
          <div>
            <div className="p-4 border-b border-[#E8DECB] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => {
                    setCouponSearch(e.target.value);
                    setCouponPage(1);
                  }}
                  placeholder="Search coupon code..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
                />
              </div>

              {couponsData && (
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#68756E]">
                  <span>
                    Coupon-Driven Gross Sales:{' '}
                    <strong className="text-[#123B2A]">
                      {formatInr(couponsData.totals.couponDrivenGrossSalesRupees)}
                    </strong>
                  </span>
                  <span>
                    Avg Discount / Order:{' '}
                    <strong className="text-[#123B2A]">
                      {formatInr(couponsData.totals.averageDiscountPerCouponOrderRupees)}
                    </strong>
                  </span>
                  <span>
                    Order Share:{' '}
                    <strong className="text-[#C6A15B]">
                      {formatPercent(couponsData.totals.couponOrderSharePercent)}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {couponsError ? (
              <div className="p-6 text-center text-red-700 text-sm">{couponsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FCFAF5] border-b border-[#E8DECB] text-[11px] font-extrabold uppercase tracking-wider text-[#68756E]">
                      <th className="py-3.5 px-4">Coupon Code</th>
                      <th className="py-3.5 px-4">Rule</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Orders (Period)</th>
                      <th className="py-3.5 px-4 text-right">Lifetime Usage</th>
                      <th className="py-3.5 px-4 text-right">Discount Given</th>
                      <th className="py-3.5 px-4 text-right">Revenue Driven</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DECB]/60 text-sm">
                    {loadingCoupons ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#68756E]">
                          Loading coupon analytics...
                        </td>
                      </tr>
                    ) : !couponsData || couponsData.coupons.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#68756E]">
                          No coupons found.
                        </td>
                      </tr>
                    ) : (
                      couponsData.coupons.map((c) => (
                        <tr key={c.code} className="hover:bg-[#FCFAF5]/70">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#123B2A]">
                            {c.code}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#68756E]">
                            {c.discountType === 'PERCENTAGE'
                              ? `${c.discountValue}% OFF`
                              : `${formatInr(c.discountValue)} OFF`}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                c.isActive && !c.isExpired
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {c.isExpired ? 'EXPIRED' : c.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1C1C1C]">
                            {formatNumber(c.ordersInPeriod)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#68756E]">
                            {formatNumber(c.totalUsedCount)}
                            {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-800">
                            {formatInr(c.discountGivenRupees)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#123B2A]">
                            {formatInr(c.grossRevenueGeneratedRupees)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {couponsData && (
              <div className="px-4 py-3 bg-[#FCFAF5] border-t border-[#E8DECB] flex items-center justify-between text-xs text-[#68756E]">
                <span>
                  Page <strong>{couponsData.pagination.page}</strong> of{' '}
                  <strong>{couponsData.pagination.totalPages}</strong> (
                  {couponsData.pagination.total} coupons)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={couponPage <= 1}
                    onClick={() => setCouponPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[#E8DECB] bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={couponPage >= couponsData.pagination.totalPages}
                    onClick={() =>
                      setCouponPage((p) => Math.min(couponsData.pagination.totalPages, p + 1))
                    }
                    className="p-1.5 rounded-lg border border-[#E8DECB] bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

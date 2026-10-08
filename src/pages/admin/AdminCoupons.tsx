// src/pages/admin/AdminCoupons.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TicketPercent,
  Search,
  Plus,
  Edit3,
  Power,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  IndianRupee,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import type {
  AdminCoupon,
  AdminCouponDetail,
  CouponDiscountType,
  AdminCreateCouponPayload,
  AdminUpdateCouponPayload,
} from '../../types/admin';

interface CouponFormState {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minimumOrderAmount: string;
  maximumDiscount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  isActive: boolean;
}

const INITIAL_FORM_STATE: CouponFormState = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscount: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  perCustomerLimit: '1',
  isActive: true,
};

function toDateTimeLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [summary, setSummary] = useState({
    totalCoupons: 0,
    totalOrdersUsingCoupons: 0,
    totalDiscountGiven: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CouponDiscountType>('ALL');
  const [validityFilter, setValidityFilter] = useState<'ALL' | 'VALID' | 'EXPIRED'>('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Create / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [formState, setFormState] = useState<CouponFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle Active ConfirmDialog state
  const [toggleTarget, setToggleTarget] = useState<AdminCoupon | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Usage Detail Modal state
  const [detailCoupon, setDetailCoupon] = useState<AdminCouponDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCoupons = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getCoupons({
          page,
          limit: pagination.limit,
          search: appliedSearch || undefined,
          isActive:
            activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE' ? true : false,
          discountType: typeFilter === 'ALL' ? undefined : typeFilter,
          validity: validityFilter,
        });
        setCoupons(res.coupons);
        setSummary(res.summary);
        setPagination(res.pagination);
      } catch (err: any) {
        setError(err?.message || 'Failed to load coupons.');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, appliedSearch, activeFilter, typeFilter, validityFilter]
  );

  useEffect(() => {
    fetchCoupons(1);
  }, [appliedSearch, activeFilter, typeFilter, validityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim().toUpperCase());
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormState(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setFormState({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrderAmount:
        coupon.minimumOrderAmount !== null && coupon.minimumOrderAmount !== undefined
          ? String(coupon.minimumOrderAmount)
          : '',
      maximumDiscount:
        coupon.maximumDiscount !== null && coupon.maximumDiscount !== undefined
          ? String(coupon.maximumDiscount)
          : '',
      startsAt: toDateTimeLocalInput(coupon.startsAt),
      expiresAt: toDateTimeLocalInput(coupon.expiresAt),
      usageLimit:
        coupon.usageLimit !== null && coupon.usageLimit !== undefined
          ? String(coupon.usageLimit)
          : '',
      perCustomerLimit:
        coupon.perCustomerLimit !== null && coupon.perCustomerLimit !== undefined
          ? String(coupon.perCustomerLimit)
          : '',
      isActive: coupon.isActive,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openUsageModal = async (coupon: AdminCoupon) => {
    setLoadingDetail(true);
    setDetailCoupon({ ...coupon, recentOrders: [] });
    try {
      const full = await adminService.getCouponById(coupon.id);
      setDetailCoupon(full);
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err?.message || 'Failed to load coupon usage details.',
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalizedCode = formState.code.trim().toUpperCase();
    if (!editingCoupon) {
      if (!normalizedCode || normalizedCode.length < 2 || normalizedCode.length > 32) {
        setFormError('Coupon code must be between 2 and 32 characters.');
        return;
      }
      if (!/^[A-Z0-9_-]{2,32}$/.test(normalizedCode)) {
        setFormError(
          'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores.'
        );
        return;
      }
    }

    const discountValue = Number(formState.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }

    if (formState.discountType === 'PERCENTAGE' && discountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    let minimumOrderAmount: number | null = null;
    if (formState.minimumOrderAmount.trim() !== '') {
      minimumOrderAmount = Number(formState.minimumOrderAmount);
      if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
        setFormError('Minimum order amount cannot be negative.');
        return;
      }
    }

    let maximumDiscount: number | null = null;
    if (formState.maximumDiscount.trim() !== '') {
      maximumDiscount = Number(formState.maximumDiscount);
      if (!Number.isFinite(maximumDiscount) || maximumDiscount <= 0) {
        setFormError('Maximum discount amount must be greater than zero.');
        return;
      }
    }

    let usageLimit: number | null = null;
    if (formState.usageLimit.trim() !== '') {
      usageLimit = Number(formState.usageLimit);
      if (!Number.isInteger(usageLimit) || usageLimit < 1) {
        setFormError('Usage limit must be a whole number >= 1.');
        return;
      }
    }

    let perCustomerLimit: number | null = null;
    if (formState.perCustomerLimit.trim() !== '') {
      perCustomerLimit = Number(formState.perCustomerLimit);
      if (!Number.isInteger(perCustomerLimit) || perCustomerLimit < 1) {
        setFormError('Per-customer limit must be a whole number >= 1.');
        return;
      }
    }

    const startsAtIso = formState.startsAt ? new Date(formState.startsAt).toISOString() : null;
    const expiresAtIso = formState.expiresAt ? new Date(formState.expiresAt).toISOString() : null;

    if (startsAtIso && expiresAtIso) {
      if (new Date(startsAtIso).getTime() >= new Date(expiresAtIso).getTime()) {
        setFormError('Expiry date must be later than start date.');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingCoupon) {
        const updatePayload: AdminUpdateCouponPayload = {
          description: formState.description.trim() || null,
          discountType: formState.discountType,
          discountValue,
          minimumOrderAmount,
          maximumDiscount: formState.discountType === 'PERCENTAGE' ? maximumDiscount : null,
          startsAt: startsAtIso,
          expiresAt: expiresAtIso,
          usageLimit,
          perCustomerLimit,
          isActive: formState.isActive,
        };
        await adminService.updateCoupon(editingCoupon.id, updatePayload);
        setBannerMessage({
          type: 'success',
          text: `Coupon ${editingCoupon.code} updated successfully.`,
        });
      } else {
        const createPayload: AdminCreateCouponPayload = {
          code: normalizedCode,
          description: formState.description.trim() || null,
          discountType: formState.discountType,
          discountValue,
          minimumOrderAmount,
          maximumDiscount: formState.discountType === 'PERCENTAGE' ? maximumDiscount : null,
          startsAt: startsAtIso,
          expiresAt: expiresAtIso,
          usageLimit,
          perCustomerLimit,
          isActive: formState.isActive,
        };
        const created = await adminService.createCoupon(createPayload);
        setBannerMessage({
          type: 'success',
          text: `Coupon ${created.code} created successfully.`,
        });
      }
      setIsFormModalOpen(false);
      await fetchCoupons(editingCoupon ? pagination.page : 1);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      const nextActive = !toggleTarget.isActive;
      await adminService.updateCoupon(toggleTarget.id, { isActive: nextActive });
      setBannerMessage({
        type: 'success',
        text: `Coupon ${toggleTarget.code} ${nextActive ? 'activated' : 'deactivated'} successfully.`,
      });
      setToggleTarget(null);
      await fetchCoupons(pagination.page);
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err?.message || 'Failed to update coupon status.',
      });
      setToggleTarget(null);
    } finally {
      setIsToggling(false);
    }
  };

  const renderStatusBadge = (coupon: AdminCoupon) => {
    switch (coupon.effectiveStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            Active
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Expired
          </span>
        );
      case 'LIMIT_REACHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            Limit Reached
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
            Scheduled
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
            Inactive
          </span>
        );
    }
  };

  const activeCountOnPage = coupons.filter((c) => c.effectiveStatus === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C6A15B] block">
            PROMOTIONS &amp; PRICING INTEGRITY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
            Coupons &amp; Discounts
          </h1>
          <p className="text-xs text-[#68756E] mt-0.5">
            Create and manage server-authoritative order discount codes, usage limits, and validity windows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchCoupons(pagination.page)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DECB] text-xs font-bold text-[#123B2A] hover:bg-[#F7F1E5] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C6A15B]" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
            Matching Coupons
          </span>
          <span className="font-serif text-2xl font-bold text-[#092218] mt-1 block">
            {summary.totalCoupons}
          </span>
          <span className="text-[11px] text-[#68756E] mt-1 block">
            {activeCountOnPage} active on current page
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
            Orders Using Coupons
          </span>
          <span className="font-serif text-2xl font-bold text-[#123B2A] mt-1 block">
            {summary.totalOrdersUsingCoupons}
          </span>
          <span className="text-[11px] text-[#68756E] mt-1 block">
            Verified order redemptions
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
            Total Discount Given
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-700 mt-1 block">
            ₹{summary.totalDiscountGiven.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-[#68756E] mt-1 block">
            Across all coupon orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8DECB] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
            Stacking Policy
          </span>
          <span className="font-serif text-lg font-bold text-[#092218] mt-1 block">
            Single Coupon / Order
          </span>
          <span className="text-[11px] text-[#68756E] mt-1 block">
            Server-authoritative paise math
          </span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <form onSubmit={handleSearchSubmit} className="md:col-span-5">
            <label
              htmlFor="admin-coupon-search"
              className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
            >
              Search by Coupon Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#68756E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-coupon-search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10, SAVE20"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8DECB] text-xs font-mono uppercase text-[#1C1C1C] placeholder:font-sans placeholder:normal-case focus:outline-none focus:border-[#123B2A]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          <div className="md:col-span-2">
            <label
              htmlFor="admin-coupon-status-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
            >
              Status
            </label>
            <select
              id="admin-coupon-status-filter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-[#E8DECB] bg-white text-xs font-semibold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="admin-coupon-type-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
            >
              Discount Type
            </label>
            <select
              id="admin-coupon-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-[#E8DECB] bg-white text-xs font-semibold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
            >
              <option value="ALL">All Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="admin-coupon-validity-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
            >
              Validity Window
            </label>
            <select
              id="admin-coupon-validity-filter"
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-[#E8DECB] bg-white text-xs font-semibold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
            >
              <option value="ALL">All (Valid &amp; Expired)</option>
              <option value="VALID">Currently Valid</option>
              <option value="EXPIRED">Expired Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#68756E]">Loading coupons...</div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-xs font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => fetchCoupons(pagination.page)}
              className="px-4 py-2 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <TicketPercent className="w-10 h-10 text-[#68756E]/40 mx-auto" />
            <h2 className="font-serif text-xl font-bold text-[#092218]">No Coupons Found</h2>
            <p className="text-xs text-[#68756E] max-w-md mx-auto">
              Create your first promotional coupon code to offer percentage or fixed-amount discounts at checkout.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C6A15B]" />
              <span>Create Coupon</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Coupons table">
              <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                <tr>
                  <th className="py-3.5 px-4">Code &amp; Description</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-3">Value</th>
                  <th className="py-3.5 px-3">Min Order</th>
                  <th className="py-3.5 px-3">Max Discount</th>
                  <th className="py-3.5 px-3">Usage / Limit</th>
                  <th className="py-3.5 px-3">Per Customer</th>
                  <th className="py-3.5 px-3">Start / Expiry</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DECB]/60">
                {coupons.map((coupon) => {
                  const formattedStart = coupon.startsAt
                    ? new Date(coupon.startsAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null;
                  const formattedExpiry = coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null;

                  return (
                    <tr key={coupon.id} className="hover:bg-[#FCFAF5] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-extrabold text-sm text-[#092218] block">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <span className="text-[11px] text-[#68756E] block max-w-xs truncate">
                            {coupon.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#1C1C1C]">
                        {coupon.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed (₹)'}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-[#123B2A]">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </td>
                      <td className="py-3.5 px-3 text-[#1C1C1C]">
                        {coupon.minimumOrderAmount && coupon.minimumOrderAmount > 0
                          ? `Min ₹${coupon.minimumOrderAmount}`
                          : 'None'}
                      </td>
                      <td className="py-3.5 px-3 text-[#1C1C1C]">
                        {coupon.discountType === 'PERCENTAGE' && coupon.maximumDiscount
                          ? `Max ₹${coupon.maximumDiscount}`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#1C1C1C] block">
                          Used {coupon.usedCount}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / ∞'}
                        </span>
                        {coupon.usageStats?.totalDiscountGiven > 0 && (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            ₹{coupon.usageStats.totalDiscountGiven} saved
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[#1C1C1C]">
                        {coupon.perCustomerLimit ? `${coupon.perCustomerLimit} / user` : 'Unlimited'}
                      </td>
                      <td className="py-3.5 px-3 text-[11px] text-[#68756E]">
                        <div>Start: {formattedStart || 'Immediate'}</div>
                        <div>Exp: {formattedExpiry || 'No Expiry'}</div>
                      </td>
                      <td className="py-3.5 px-3">{renderStatusBadge(coupon)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUsageModal(coupon)}
                            aria-label={`View usage statistics for coupon ${coupon.code}`}
                            title="View Usage & Analytics"
                            className="p-2 rounded-lg border border-[#E8DECB] text-[#123B2A] hover:bg-[#F7F1E5] transition-colors cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(coupon)}
                            aria-label={`Edit coupon ${coupon.code}`}
                            title="Edit Coupon"
                            className="p-2 rounded-lg border border-[#E8DECB] text-[#123B2A] hover:bg-[#F7F1E5] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToggleTarget(coupon)}
                            aria-label={`${
                              coupon.isActive ? 'Deactivate' : 'Activate'
                            } coupon ${coupon.code}`}
                            title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              coupon.isActive
                                ? 'border-amber-200 text-amber-800 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E8DECB] bg-[#FCFAF5] flex items-center justify-between text-xs">
            <span className="text-[#68756E]">
              Page <span className="font-bold text-[#1C1C1C]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#1C1C1C]">{pagination.totalPages}</span> (
              {pagination.total} coupons)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchCoupons(pagination.page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-white text-[#1C1C1C] font-bold disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchCoupons(pagination.page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-white text-[#1C1C1C] font-bold disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {isFormModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
        >
          <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DECB]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                  {editingCoupon ? 'UPDATE COUPON CONFIGURATION' : 'NEW PROMOTIONAL COUPON'}
                </span>
                <h2 id="coupon-modal-title" className="font-serif text-xl font-bold text-[#092218]">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Coupon'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#68756E] hover:text-[#1C1C1C] hover:bg-[#F7F1E5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingCoupon && editingCoupon.usedCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold">Historical Accounting Protected: </span>
                This coupon has already been used on {editingCoupon.usedCount} order(s). Updating discount values affects only future orders; past orders retain their original snapshot discount.
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="coupon-form-code"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Coupon Code *
                  </label>
                  <input
                    id="coupon-form-code"
                    type="text"
                    required
                    disabled={Boolean(editingCoupon)}
                    value={formState.code}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. SAVE20"
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] font-mono uppercase font-bold text-[#092218] disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon-form-type"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Discount Type *
                  </label>
                  <select
                    id="coupon-form-type"
                    value={formState.discountType}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        discountType: e.target.value as CouponDiscountType,
                      }))
                    }
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] bg-white font-semibold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="coupon-form-description"
                  className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                >
                  Description
                </label>
                <input
                  id="coupon-form-description"
                  type="text"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="e.g. Festive 20% off on orders above ₹500"
                  className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label
                    htmlFor="coupon-form-value"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    {formState.discountType === 'PERCENTAGE'
                      ? 'Discount (%) *'
                      : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    id="coupon-form-value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formState.discountType === 'PERCENTAGE' ? '100' : undefined}
                    required
                    value={formState.discountValue}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, discountValue: e.target.value }))
                    }
                    placeholder={formState.discountType === 'PERCENTAGE' ? '20' : '100'}
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] font-bold focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon-form-min-order"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Min Order (₹)
                  </label>
                  <input
                    id="coupon-form-min-order"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.minimumOrderAmount}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, minimumOrderAmount: e.target.value }))
                    }
                    placeholder="Optional (e.g. 500)"
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon-form-max-discount"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Max Discount (₹)
                  </label>
                  <input
                    id="coupon-form-max-discount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={formState.discountType !== 'PERCENTAGE'}
                    value={formState.discountType === 'PERCENTAGE' ? formState.maximumDiscount : ''}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, maximumDiscount: e.target.value }))
                    }
                    placeholder={
                      formState.discountType === 'PERCENTAGE' ? 'Optional (e.g. 300)' : 'N/A'
                    }
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] disabled:bg-gray-100 focus:outline-none focus:border-[#123B2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="coupon-form-starts-at"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Start Date &amp; Time
                  </label>
                  <input
                    id="coupon-form-starts-at"
                    type="datetime-local"
                    value={formState.startsAt}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, startsAt: e.target.value }))
                    }
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon-form-expires-at"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Expiry Date &amp; Time
                  </label>
                  <input
                    id="coupon-form-expires-at"
                    type="datetime-local"
                    value={formState.expiresAt}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="coupon-form-usage-limit"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Global Usage Limit
                  </label>
                  <input
                    id="coupon-form-usage-limit"
                    type="number"
                    step="1"
                    min="1"
                    value={formState.usageLimit}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, usageLimit: e.target.value }))
                    }
                    placeholder="Unlimited if blank (e.g. 100)"
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="coupon-form-per-customer-limit"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] mb-1"
                  >
                    Per-Customer Limit
                  </label>
                  <input
                    id="coupon-form-per-customer-limit"
                    type="number"
                    step="1"
                    min="1"
                    value={formState.perCustomerLimit}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, perCustomerLimit: e.target.value }))
                    }
                    placeholder="Unlimited if blank (e.g. 1)"
                    className="w-full min-h-10 px-3 rounded-lg border border-[#E8DECB] text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-[#123B2A] focus:ring-[#123B2A]"
                  />
                  <span className="font-bold text-[#1C1C1C]">
                    Coupon is Active and available for eligible customer checkouts
                  </span>
                </label>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DECB]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-[#E8DECB] text-[#1C1C1C] font-bold uppercase tracking-wider hover:bg-[#F7F1E5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingCoupon
                    ? 'Save Changes'
                    : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Usage Statistics & Recent Orders Modal */}
      {detailCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-usage-modal-title"
        >
          <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DECB]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                  COUPON REDEMPTION ANALYTICS
                </span>
                <h2
                  id="coupon-usage-modal-title"
                  className="font-serif text-xl font-bold text-[#092218] flex items-center gap-2"
                >
                  <span className="font-mono">{detailCoupon.code}</span>
                  {renderStatusBadge(detailCoupon)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailCoupon(null)}
                aria-label="Close usage modal"
                className="p-1.5 rounded-lg text-[#68756E] hover:text-[#1C1C1C] hover:bg-[#F7F1E5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]">
                <span className="text-[10px] font-bold uppercase text-[#68756E] flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#C6A15B]" /> Redemptions
                </span>
                <span className="text-base font-extrabold text-[#092218] mt-1 block">
                  {detailCoupon.usedCount}
                  {detailCoupon.usageLimit ? ` / ${detailCoupon.usageLimit}` : ' (No Limit)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]">
                <span className="text-[10px] font-bold uppercase text-[#68756E] flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-emerald-700" /> Discount Given
                </span>
                <span className="text-base font-extrabold text-emerald-700 mt-1 block">
                  ₹{detailCoupon.usageStats?.totalDiscountGiven ?? 0}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]">
                <span className="text-[10px] font-bold uppercase text-[#68756E] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#123B2A]" /> Gross Subtotal
                </span>
                <span className="text-base font-extrabold text-[#1C1C1C] mt-1 block">
                  ₹{detailCoupon.usageStats?.revenueBeforeDiscount ?? 0}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]">
                <span className="text-[10px] font-bold uppercase text-[#68756E] flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-[#123B2A]" /> Net Order Total
                </span>
                <span className="text-base font-extrabold text-[#123B2A] mt-1 block">
                  ₹{detailCoupon.usageStats?.revenueAfterDiscount ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B2A]">
                Orders Using {detailCoupon.code}
              </h3>

              {loadingDetail ? (
                <div className="p-8 text-center text-xs text-[#68756E]">
                  Loading order redemptions...
                </div>
              ) : !detailCoupon.recentOrders || detailCoupon.recentOrders.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] text-center text-xs text-[#68756E]">
                  No orders have redeemed this coupon yet.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-[#E8DECB] rounded-xl divide-y divide-[#E8DECB]/60">
                  {detailCoupon.recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-[#FCFAF5]"
                    >
                      <div>
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="font-mono font-bold text-[#123B2A] hover:underline"
                        >
                          #{ord.orderNumber}
                        </Link>
                        <span className="text-[#68756E] block text-[11px]">
                          {ord.user?.name || 'Customer'} ({ord.user?.email || '—'})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 block">
                          -₹{ord.discountAmount ?? 0} saved
                        </span>
                        <span className="text-[11px] text-[#68756E]">
                          Total: ₹{ord.totalAmount} • {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E8DECB]">
              <button
                type="button"
                onClick={() => setDetailCoupon(null)}
                className="px-4 py-2 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate / Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        title={
          toggleTarget?.isActive
            ? `Deactivate coupon ${toggleTarget.code}?`
            : `Activate coupon ${toggleTarget?.code}?`
        }
        message={
          toggleTarget?.isActive
            ? 'Deactivating this coupon prevents customers from applying it at checkout. Historical orders and accounting records remain intact.'
            : 'Activating this coupon allows eligible customers to apply it during checkout within its configured validity window and usage limits.'
        }
        confirmLabel={toggleTarget?.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
        cancelLabel="Cancel"
        isDestructive={Boolean(toggleTarget?.isActive)}
        isLoading={isToggling}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
};

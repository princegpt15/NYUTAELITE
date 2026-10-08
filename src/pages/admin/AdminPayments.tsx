// src/pages/admin/AdminPayments.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  Lock,
  Calendar,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { ApiError } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';
import type {
  AdminPaymentListItem,
  AdminPagination,
  AdminPaymentsFilterParams,
} from '../../types/admin';
import type { OrderStatus, PaymentStatus } from '../../types';

function resolvePaymentErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You do not have permission to access payment information.';
      case 404:
        return 'Payment not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Something went wrong. Please try again.';
      default:
        return err.message || 'Something went wrong. Please try again.';
    }
  }
  if (err instanceof TypeError || (err as any)?.message?.toLowerCase()?.includes('fetch')) {
    return 'Unable to connect to the server.';
  }
  return (err as any)?.message || 'Something went wrong. Please try again.';
}

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<AdminPaymentListItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controlled search & server filters
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | ''>('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<OrderStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminPaymentsFilterParams = {
        page: currentPage,
        limit: 15,
        search: committedSearch || undefined,
        status: selectedPaymentStatus || undefined,
        orderStatus: selectedOrderStatus || undefined,
      };
      const res = await adminService.getPayments(params);
      setPayments(res.payments);
      setPagination({
        ...res.pagination,
        totalPages: Math.max(1, res.pagination.totalPages || 1),
      });
    } catch (err: unknown) {
      setError(resolvePaymentErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, committedSearch, selectedPaymentStatus, selectedOrderStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed === committedSearch && currentPage === 1) {
      return;
    }
    setCommittedSearch(trimmed);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCommittedSearch('');
    setSelectedPaymentStatus('');
    setSelectedOrderStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    committedSearch || selectedPaymentStatus || selectedOrderStatus
  );

  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase block">
            FINANCIAL LEDGER
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-0.5">
            Payment Transactions
          </h1>
          <p className="text-xs text-[#68756E] mt-0.5">
            {pagination.total} gateway {pagination.total === 1 ? 'transaction' : 'transactions'} audited across Razorpay &amp; internal orders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] text-[11px] font-bold text-[#68756E]">
            <Lock className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
            <span>Read-Only Ledger</span>
          </span>

          <button
            type="button"
            onClick={fetchPayments}
            disabled={loading}
            aria-label="Refresh payment transactions"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#F7F1E5] border border-[#E8DECB] text-[#123B2A] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs w-fit disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DECB] shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3" role="search">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search payments by Payment ID, Razorpay ID, Order Number, or Customer Email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Razorpay Payment ID, Razorpay Order ID, Order #, or Customer Email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] focus:bg-white focus:ring-1 focus:ring-[#123B2A] transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Payment Status Filter */}
            <div className="flex-1 sm:w-40">
              <select
                aria-label="Filter by Payment Status"
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value as PaymentStatus | '');
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Payment Status</option>
                <option value="CAPTURED">Captured</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Order Status Filter */}
            <div className="flex-1 sm:w-40">
              <select
                aria-label="Filter by Order Status"
                value={selectedOrderStatus}
                onChange={(e) => {
                  setSelectedOrderStatus(e.target.value as OrderStatus | '');
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Order Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
            >
              <Filter className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
              <span>Filter</span>
            </button>

            {(hasActiveFilters || searchInput.trim() !== '') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-[#E8DECB] hover:bg-[#F7F1E5] text-[#68756E] hover:text-[#1C1C1C] text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error State Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchPayments}
            className="underline font-bold hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-600 rounded px-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payments Table / Mobile Cards Container */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden">
        {loading ? (
          <div aria-busy="true" aria-label="Loading payment transactions">
            {/* Desktop Skeleton */}
            <div className="hidden md:block p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 bg-[#F7F1E5] rounded-xl animate-pulse" />
              ))}
            </div>
            {/* Mobile Skeleton */}
            <div className="md:hidden p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[#E8DECB] space-y-3 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-4 bg-[#F7F1E5] rounded w-36" />
                    <div className="h-4 bg-[#F7F1E5] rounded w-20" />
                  </div>
                  <div className="h-3 bg-[#F7F1E5] rounded w-48" />
                  <div className="h-8 bg-[#F7F1E5] rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : payments.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center mx-auto border border-[#E8DECB]">
              <CreditCard className="w-6 h-6 text-[#C6A15B]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#092218]">
              No payments found
            </h2>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'No payment transactions have been recorded in the gateway ledger yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors mt-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                  <tr>
                    <th scope="col" className="py-3.5 px-6">Payment Reference</th>
                    <th scope="col" className="py-3.5 px-4">Order #</th>
                    <th scope="col" className="py-3.5 px-4">Customer</th>
                    <th scope="col" className="py-3.5 px-4">Amount</th>
                    <th scope="col" className="py-3.5 px-4">Payment Status</th>
                    <th scope="col" className="py-3.5 px-4">Order Status</th>
                    <th scope="col" className="py-3.5 px-4">Provider</th>
                    <th scope="col" className="py-3.5 px-4">Date</th>
                    <th scope="col" className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DECB]/60">
                  {payments.map((payment) => {
                    const primaryRef = payment.providerPaymentId || payment.providerOrderId || payment.id.slice(0, 12);
                    const isRefundRow =
                      payment.status === 'REFUNDED' &&
                      Boolean(payment.providerPaymentId && payment.providerPaymentId.startsWith('rfnd_'));
                    const customerName = payment.order?.user?.name?.trim() || 'Registered Customer';
                    const customerEmail = payment.order?.user?.email || '—';

                    return (
                      <tr key={payment.id} className="hover:bg-[#FCFAF5] transition-colors">
                        <td className="py-3.5 px-6">
                          <Link
                            to={`/admin/payments/${payment.id}`}
                            className="font-mono font-bold text-[#092218] hover:text-[#C6A15B] transition-colors block truncate max-w-[180px] focus:outline-none focus:underline"
                          >
                            {primaryRef}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isRefundRow ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700">
                                Refund ID
                              </span>
                            ) : payment.signatureVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                                HMAC Verified
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#68756E] font-mono">
                                ID: {payment.id.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#123B2A]">
                          {payment.order ? (
                            <Link
                              to={`/admin/orders/${payment.order.id}`}
                              className="hover:text-[#C6A15B] transition-colors focus:outline-none focus:underline"
                            >
                              #{payment.order.orderNumber}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#1C1C1C] block truncate max-w-[160px]">
                            {customerName}
                          </span>
                          <span className="text-[11px] text-[#68756E] block truncate max-w-[160px]">
                            {customerEmail}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#123B2A] whitespace-nowrap">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={payment.status} type="payment" />
                        </td>
                        <td className="py-3.5 px-4">
                          {payment.order?.status ? (
                            <StatusBadge status={payment.order.status} type="order" />
                          ) : (
                            <span className="text-[#68756E]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB]">
                            {payment.provider}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#68756E] whitespace-nowrap">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            to={`/admin/payments/${payment.id}`}
                            aria-label={`View payment details for ${primaryRef}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#123B2A] hover:text-white text-[#123B2A] text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="md:hidden divide-y divide-[#E8DECB]">
              {payments.map((payment) => {
                const primaryRef = payment.providerPaymentId || payment.providerOrderId || payment.id.slice(0, 12);
                const customerName = payment.order?.user?.name?.trim() || 'Registered Customer';
                const customerEmail = payment.order?.user?.email || '—';

                return (
                  <div key={payment.id} className="p-4 space-y-3 hover:bg-[#FCFAF5] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/payments/${payment.id}`}
                          className="font-mono font-bold text-sm text-[#092218] hover:text-[#C6A15B] block truncate"
                        >
                          {primaryRef}
                        </Link>
                        <span className="text-xs font-semibold text-[#1C1C1C] block truncate mt-0.5">
                          {customerName} ({customerEmail})
                        </span>
                      </div>
                      <span className="font-serif font-black text-base text-[#123B2A] shrink-0">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={payment.status} type="payment" />
                      {payment.order?.status && (
                        <StatusBadge status={payment.order.status} type="order" />
                      )}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB]">
                        {payment.provider}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#68756E] pt-1">
                      <span>
                        Order:{' '}
                        {payment.order ? (
                          <Link
                            to={`/admin/orders/${payment.order.id}`}
                            className="font-mono font-bold text-[#123B2A] hover:underline"
                          >
                            #{payment.order.orderNumber}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C6A15B]" aria-hidden="true" />
                        {formatDate(payment.createdAt)}
                      </span>
                    </div>

                    <div className="pt-1">
                      <Link
                        to={`/admin/payments/${payment.id}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-4 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
                        <span>View Transaction Details</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bounded Pagination Footer */}
        {!loading && payments.length > 0 && (
          <div className="p-4 bg-[#FCFAF5] border-t border-[#E8DECB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#68756E]">
              Showing page <span className="font-bold text-[#1C1C1C]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#1C1C1C]">{pagination.totalPages}</span> ({pagination.total}{' '}
              {pagination.total === 1 ? 'payment' : 'payments'})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] font-bold hover:bg-[#F7F1E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                aria-label="Next page"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] font-bold hover:bg-[#F7F1E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

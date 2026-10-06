// src/pages/admin/AdminPaymentDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  Mail,
  Phone,
  Clock,
  RefreshCw,
  AlertCircle,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { ApiError } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';
import type { AdminPaymentDetail as AdminPaymentDetailType } from '../../types/admin';

function resolvePaymentDetailError(err: unknown): string {
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

export const AdminPaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<AdminPaymentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPaymentById(id);
      setPayment(data);
    } catch (err: unknown) {
      setError(resolvePaymentDetailError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPaymentDetail();
  }, [fetchPaymentDetail]);

  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto" aria-busy="true" aria-label="Loading payment details">
        <div className="h-5 bg-[#F7F1E5] rounded w-36 animate-pulse" />
        <div className="bg-white p-8 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4 animate-pulse">
          <div className="h-7 bg-[#F7F1E5] rounded w-64" />
          <div className="h-4 bg-[#F7F1E5] rounded w-44" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-white rounded-2xl border border-[#E8DECB] animate-pulse" />
          <div className="h-56 bg-white rounded-2xl border border-[#E8DECB] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div
        role="alert"
        className="bg-white p-8 rounded-2xl border border-red-200 shadow-2xs text-center space-y-4 max-w-lg mx-auto my-12"
      >
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#1C1C1C]">
          {error === 'Payment not found.' ? 'Payment not found.' : 'Unable to Load Payment'}
        </h1>
        <p className="text-xs text-[#68756E]">{error || 'Payment not found.'}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[#092218] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Payments</span>
          </Link>
          {error !== 'Payment not found.' && (
            <button
              type="button"
              onClick={fetchPaymentDetail}
              className="inline-flex items-center gap-2 border border-[#E8DECB] bg-white hover:bg-[#F7F1E5] text-[#123B2A] text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const primaryRef = payment.providerPaymentId || payment.providerOrderId || payment.id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/payments"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] transition-colors w-fit focus:outline-none focus:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to All Payments</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F1E5] border border-[#E8DECB] text-[11px] font-bold text-[#68756E]">
            <Lock className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
            <span>Read-Only Audit Record</span>
          </span>

          <button
            type="button"
            onClick={fetchPaymentDetail}
            disabled={loading}
            aria-label="Refresh payment details"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E8DECB] bg-white hover:bg-[#F7F1E5] text-xs font-bold text-[#123B2A] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Payment Summary Header Card */}
      <section
        aria-labelledby="payment-summary-heading"
        className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8DECB]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                PAYMENT TRANSACTION SUMMARY
              </span>
              <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#F7F1E5] text-[#123B2A] border border-[#E8DECB]">
                {payment.provider}
              </span>
            </div>
            <h1
              id="payment-summary-heading"
              className="font-mono text-xl sm:text-2xl font-bold text-[#092218] break-all"
            >
              {primaryRef}
            </h1>
            <p className="text-xs text-[#68756E] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
              <span>Created {formatDateTime(payment.createdAt)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-[#68756E] uppercase font-bold block">
                Transaction Amount ({payment.currency})
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-black text-[#123B2A]">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
            <StatusBadge status={payment.status} type="payment" className="text-xs px-3 py-1" />
          </div>
        </div>

        {/* Safe Razorpay Gateway References & Cryptographic Audit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
              Internal Payment ID
            </span>
            <span className="font-mono text-xs font-bold text-[#1C1C1C] break-all block">
              {payment.id}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
              Razorpay Order ID
            </span>
            <span className="font-mono text-xs font-bold text-[#123B2A] break-all block">
              {payment.providerOrderId || '—'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
              Razorpay Payment ID
            </span>
            <span className="font-mono text-xs font-bold text-[#123B2A] break-all block">
              {payment.providerPaymentId || '—'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
              Cryptographic Verification
            </span>
            {payment.signatureVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>HMAC SHA-256 Verified</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-800">
                Awaiting Gateway Capture
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#68756E]">
          <span>
            Initiated Timestamp: <strong className="text-[#1C1C1C]">{formatDateTime(payment.createdAt)}</strong>
          </span>
          <span>
            {payment.status === 'CAPTURED' ? 'Captured / Settled Timestamp:' : 'Last Updated Timestamp:'}{' '}
            <strong className="text-[#1C1C1C]">{formatDateTime(payment.updatedAt)}</strong>
          </span>
        </div>
      </section>

      {/* Associated Order & Customer Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Associated Order Card */}
        <section
          aria-labelledby="payment-order-heading"
          className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DECB]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
                <h2 id="payment-order-heading" className="font-serif text-lg font-bold text-[#092218]">
                  Associated Order
                </h2>
              </div>
              {payment.order?.status && (
                <StatusBadge status={payment.order.status} type="order" />
              )}
            </div>

            {payment.order ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#68756E] uppercase font-bold text-[10px]">Order Number</span>
                  <span className="font-mono font-bold text-sm text-[#092218]">
                    #{payment.order.orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#68756E] uppercase font-bold text-[10px]">Order Total</span>
                  <span className="font-extrabold text-sm text-[#123B2A]">
                    {formatCurrency(payment.order.totalAmount, payment.order.currency || payment.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#68756E] uppercase font-bold text-[10px]">Shipping Status</span>
                  <StatusBadge status={payment.order.shippingStatus} type="shipping" />
                </div>
                {payment.order.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#68756E] uppercase font-bold text-[10px]">Order Date</span>
                    <span className="font-medium text-[#1C1C1C]">
                      {formatDateTime(payment.order.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#68756E]">Associated order metadata unavailable.</p>
            )}
          </div>

          {payment.order && (
            <div className="pt-3 border-t border-[#E8DECB]">
              <Link
                to={`/admin/orders/${payment.order.id}`}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              >
                <span>View Order</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        {/* Customer Information Card */}
        <section
          aria-labelledby="payment-customer-heading"
          className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DECB]">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
                <h2 id="payment-customer-heading" className="font-serif text-lg font-bold text-[#092218]">
                  Customer Details
                </h2>
              </div>
            </div>

            {payment.order?.user ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#68756E] block">
                    Full Name
                  </span>
                  <span className="font-bold text-sm text-[#092218]">
                    {payment.order.user.name || 'Registered Customer'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#1C1C1C]">
                  <Mail className="w-4 h-4 text-[#C6A15B] shrink-0" aria-hidden="true" />
                  <span className="font-medium truncate">{payment.order.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#1C1C1C]">
                  <Phone className="w-4 h-4 text-[#C6A15B] shrink-0" aria-hidden="true" />
                  <span className="font-medium">
                    {payment.order.user.phone || 'No phone number on file'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#68756E]">Customer account information unavailable.</p>
            )}
          </div>

          {payment.order?.user?.id && (
            <div className="pt-3 border-t border-[#E8DECB]">
              <Link
                to={`/admin/customers/${payment.order.user.id}`}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] hover:bg-[#123B2A] hover:text-white text-[#123B2A] text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
              >
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>View Customer Profile</span>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

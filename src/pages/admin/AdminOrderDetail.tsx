// src/pages/admin/AdminOrderDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User as UserIcon,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Truck,
  RefreshCw,
  Clock,
  ShieldCheck,
  XCircle,
  Play,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { trackAuthoritativeRefund } from '../../services/analytics';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import type {
  AdminOrderDetail as AdminOrderDetailType,
  AdminRefundOrderResult,
} from '../../types/admin';
import type { OrderStatus, ShippingStatus } from '../../types';

const formatAdminOrderError = (err: any): string => {
  const status = err?.status || err?.statusCode;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to process refunds.';
  if (status === 404) return 'Order or payment not found.';
  if (status === 409) return 'Refund is already being processed.';
  if (status === 422 && err?.message) return err.message;
  if (status === 502) return 'Refund could not be completed. No refund was recorded.';
  if (
    err?.code === 'NETWORK_ERROR' ||
    err?.message?.toLowerCase().includes('network') ||
    err?.message?.toLowerCase().includes('failed to fetch')
  ) {
    return 'Unable to connect to the server.';
  }
  return err?.message || 'Failed to process order request.';
};

const ALLOWED_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromSearch = (location.state as { fromSearch?: string } | null)?.fromSearch || '';
  const backUrl = `/admin/orders${fromSearch}`;

  const [order, setOrder] = useState<AdminOrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status mutation state
  const [targetStatus, setTargetStatus] = useState<OrderStatus | ''>('');
  const [targetShippingStatus, setTargetShippingStatus] = useState<ShippingStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Refund & Return mutation state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundResult, setRefundResult] = useState<AdminRefundOrderResult | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getOrderById(id);
      setOrder(data);
      setTargetStatus(data.status);
      setTargetShippingStatus(data.shippingStatus);
    } catch (err: any) {
      setError(formatAdminOrderError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const executeStatusUpdate = async (statusToSet: OrderStatus, shippingToSet?: ShippingStatus) => {
    if (!id || !order || isUpdating) return;
    setIsUpdating(true);
    setError(null);
    setUpdateSuccess(null);

    const synchronizedShipping: ShippingStatus | undefined =
      statusToSet === 'SHIPPED'
        ? 'SHIPPED'
        : statusToSet === 'DELIVERED' && shippingToSet === 'RETURNED'
        ? 'RETURNED'
        : statusToSet === 'DELIVERED'
        ? 'DELIVERED'
        : shippingToSet;

    try {
      const updated = await adminService.updateOrderStatus(id, {
        orderStatus: statusToSet,
        ...(synchronizedShipping ? { shippingStatus: synchronizedShipping } : {}),
      });
      await fetchOrderDetail();
      setUpdateSuccess(
        `Order #${order.orderNumber} updated to ${updated.status} (Shipping: ${updated.shippingStatus}).`
      );
      setShowCancelModal(false);
    } catch (err: any) {
      setError(formatAdminOrderError(err));
      setShowCancelModal(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const executeRefund = async () => {
    if (!id || !order || isRefunding) return;
    setIsRefunding(true);
    setError(null);
    setUpdateSuccess(null);

    try {
      const result = await adminService.refundOrder(id, {
        ...(refundReason.trim() ? { reason: refundReason.trim() } : {}),
      });
      setRefundResult(result);
      setShowRefundModal(false);
      setRefundReason('');
      await fetchOrderDetail();
      setUpdateSuccess('Refund initiated successfully.');
      void trackAuthoritativeRefund({
        orderId: order.id,
        transactionId: order.orderNumber || order.id,
        refundId: (result as any).refundPaymentId || null,
        value: result.refundAmount || order.totalAmount,
        items: order.items || [],
      });
    } catch (err: any) {
      setError(formatAdminOrderError(err));
      setShowRefundModal(false);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleOrderStatusSelectChange = (nextStatus: OrderStatus) => {
    setTargetStatus(nextStatus);
    if (nextStatus === 'SHIPPED') {
      setTargetShippingStatus('SHIPPED');
    } else if (nextStatus === 'DELIVERED') {
      setTargetShippingStatus('DELIVERED');
    } else if (order) {
      setTargetShippingStatus('PENDING');
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus || !order || isUpdating) return;

    if (targetStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
      setShowCancelModal(true);
      return;
    }

    executeStatusUpdate(targetStatus, targetShippingStatus || undefined);
  };

  if (loading && !order) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-6 bg-[#F7F1E5] rounded w-36 animate-pulse" />
        <div className="bg-white p-8 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4 animate-pulse">
          <div className="h-8 bg-[#F7F1E5] rounded w-64" />
          <div className="h-4 bg-[#F7F1E5] rounded w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-[#E8DECB] animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-[#E8DECB] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-2xs text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">Order Not Found</h2>
        <p className="text-xs text-[#68756E]">{error}</p>
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[#092218] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const isTerminal = order.status === 'DELIVERED' || order.status === 'CANCELLED';
  const isPaymentCaptured = order.paymentStatus === 'CAPTURED';
  const isPaymentBlocked =
    order.paymentStatus === 'FAILED' || order.paymentStatus === 'REFUNDED';
  const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);

  const formattedCreated = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedUpdated = new Date(order.updatedAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Order progression rank for visual timeline
  const statusRankMap: Record<OrderStatus, number> = {
    PENDING: 1,
    CONFIRMED: 2,
    PROCESSING: 3,
    SHIPPED: 4,
    DELIVERED: 5,
    CANCELLED: -1,
  };
  const currentRank = statusRankMap[order.status];

  const timelineSteps = [
    {
      key: 'PLACED',
      label: 'Order Placed',
      sublabel: formattedCreated,
      completed: true,
      active: order.status === 'PENDING' && !isPaymentCaptured,
    },
    {
      key: 'PAYMENT',
      label: 'Payment Confirmed',
      sublabel: isPaymentCaptured
        ? 'Captured via Razorpay'
        : `Status: ${order.paymentStatus}`,
      // Strict requirement: Only show Payment Confirmed when payment is actually captured
      completed: isPaymentCaptured,
      active: !isPaymentCaptured && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED',
      failed: order.paymentStatus === 'FAILED' || order.paymentStatus === 'REFUNDED',
    },
    {
      key: 'CONFIRMED',
      label: 'Order Confirmed',
      sublabel: currentRank >= 2 ? 'Verified' : 'Awaiting confirmation',
      completed: currentRank >= 2,
      active: order.status === 'CONFIRMED',
    },
    {
      key: 'PROCESSING',
      label: 'Processing',
      sublabel: currentRank >= 3 ? 'Packing in Pantry' : 'Pending',
      completed: currentRank >= 3,
      active: order.status === 'PROCESSING',
    },
    {
      key: 'SHIPPED',
      label: 'Shipped',
      sublabel: currentRank >= 4 ? 'Dispatched' : 'Pending',
      completed: currentRank >= 4,
      active: order.status === 'SHIPPED',
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      sublabel: currentRank >= 5 ? 'Fulfilled' : 'Pending',
      completed: currentRank >= 5,
      active: order.status === 'DELIVERED',
    },
  ];

  const allowedNextStatuses = ALLOWED_NEXT_STATUSES[order.status] || [];
  const capturedPayment =
    order.payments?.find(
      (p) =>
        p.status === 'CAPTURED' ||
        (order.paymentStatus === 'REFUNDED' &&
          p.status === 'REFUNDED' &&
          p.providerPaymentId &&
          p.providerPaymentId.startsWith('pay_'))
    ) || (order.payments && order.payments.length > 0 ? order.payments[0] : null);
  const primaryPayment = capturedPayment;

  const refundSummary = order.refundSummary;
  const capturedAmount =
    refundSummary?.capturedAmount ??
    (capturedPayment ? capturedPayment.amount : isPaymentCaptured ? order.totalAmount : 0);
  const previouslyRefundedAmount =
    refundSummary?.previouslyRefundedAmount ??
    (order.paymentStatus === 'REFUNDED' ? capturedAmount : 0);
  const remainingRefundableAmount =
    refundSummary?.remainingRefundableAmount ??
    (order.paymentStatus === 'REFUNDED'
      ? 0
      : Math.max(0, Number((capturedAmount - previouslyRefundedAmount).toFixed(2))));

  const isRefundEligible =
    refundSummary?.isEligible ??
    (order.paymentStatus === 'CAPTURED' &&
      Boolean(capturedPayment?.providerPaymentId && capturedAmount > 0) &&
      remainingRefundableAmount > 0 &&
      (order.status === 'CANCELLED' ||
        order.status === 'DELIVERED' ||
        order.shippingStatus === 'RETURNED'));

  const canMarkReturnReceived =
    order.status === 'DELIVERED' && order.shippingStatus !== 'RETURNED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back link & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] transition-colors w-fit focus:outline-none focus:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <button
          type="button"
          onClick={fetchOrderDetail}
          disabled={loading || isUpdating || isRefunding}
          aria-label="Refresh order details"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-white hover:bg-[#F7F1E5] text-xs font-bold text-[#123B2A] transition-colors cursor-pointer w-fit disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* Paid Order Cancelled Warning Banner (Section 8 Requirement) */}
      {order.status === 'CANCELLED' && order.paymentStatus === 'CAPTURED' && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Payment captured — refund requires separate refund workflow.</span>
          </div>
          {isRefundEligible && (
            <button
              type="button"
              disabled={isRefunding}
              onClick={() => setShowRefundModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer w-fit shrink-0 focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Refund Payment</span>
            </button>
          )}
        </div>
      )}

      {/* Success Notification */}
      {updateSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setUpdateSuccess(null)}
            className="text-emerald-900 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Refund Result Banner (Section 11 Requirement) */}
      {refundResult && (
        <div
          role="region"
          aria-label="Refund initiated confirmation"
          className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-[#092218] space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Refund initiated successfully.</span>
            </div>
            <button
              type="button"
              onClick={() => setRefundResult(null)}
              className="text-xs font-bold text-emerald-900 hover:underline"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-3.5 rounded-xl border border-emerald-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#68756E] block">Refund ID</span>
              <span className="font-mono font-bold text-[#123B2A] break-all">
                {refundResult.refundId}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#68756E] block">Refund Amount</span>
              <span className="font-extrabold text-[#123B2A]">₹{refundResult.refundAmount}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#68756E] block">Date</span>
              <span className="font-semibold text-[#1C1C1C]">
                {new Date(refundResult.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#68756E] block">
                Payment Reference
              </span>
              <span className="font-mono font-bold text-[#1C1C1C] break-all">
                {refundResult.originalPaymentReference || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#68756E] block">Status</span>
              <StatusBadge status={refundResult.paymentStatus} type="payment" />
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Header Summary & Timeline Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8DECB]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                ORDER INFORMATION
              </span>
              <span className="text-xs text-[#68756E]">•</span>
              <span className="text-xs text-[#68756E] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Created: {formattedCreated}
              </span>
              <span className="text-xs text-[#68756E]">•</span>
              <span className="text-xs text-[#68756E]">Updated: {formattedUpdated}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
              Order #{order.orderNumber}
            </h1>
            <p className="text-[11px] text-[#68756E] mt-0.5">
              Order ID: <span className="font-mono text-[#1C1C1C]">{order.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-right mr-2 hidden sm:block">
              <span className="text-[10px] text-[#68756E] uppercase block">Total Amount</span>
              <span className="text-2xl font-serif font-black text-[#123B2A]">
                ₹{order.totalAmount}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={order.paymentStatus} type="payment" className="text-xs px-3 py-1" />
                <StatusBadge status={order.status} type="order" className="text-xs px-3 py-1" />
                <StatusBadge status={order.shippingStatus} type="shipping" className="text-xs px-3 py-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Order Lifecycle Timeline (Section 6) */}
        <div className="space-y-3" aria-label="Order progress timeline">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#123B2A]">
              Order Fulfillment Timeline
            </h2>
            {order.status === 'CANCELLED' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                <XCircle className="w-3.5 h-3.5" />
                Order Cancelled
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {timelineSteps.map((step, index) => {
              const isStepCompleted = step.completed;
              const isStepFailed = Boolean((step as any).failed);
              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isStepFailed
                      ? 'bg-red-50/70 border-red-200 text-red-800'
                      : isStepCompleted
                      ? 'bg-[#F7F1E5] border-[#C6A15B]/60 text-[#092218]'
                      : step.active
                      ? 'bg-white border-[#123B2A] ring-1 ring-[#123B2A]/20 text-[#092218]'
                      : 'bg-[#FCFAF5] border-[#E8DECB] text-[#68756E]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C6A15B]">
                      Step {index + 1}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isStepFailed
                          ? 'bg-red-600 text-white'
                          : isStepCompleted
                          ? 'bg-[#123B2A] text-white'
                          : 'bg-[#E8DECB] text-[#68756E]'
                      }`}
                    >
                      {isStepCompleted ? <Check className="w-3 h-3" /> : index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-snug">{step.label}</p>
                    <p className="text-[10px] opacity-80 mt-0.5 truncate">{step.sublabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Actions & Fulfillment Controls (Section 7) */}
        <div className="p-5 rounded-xl bg-[#F7F1E5]/60 border border-[#E8DECB] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#123B2A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#123B2A]">
                Fulfillment, Returns &amp; Refund Actions
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#68756E]">
              <span>Current Order Status:</span>
              <span className="font-bold text-[#1C1C1C]">{order.status}</span>
              <span>•</span>
              <span>Shipping Status:</span>
              <span className="font-bold text-[#1C1C1C]">{order.shippingStatus}</span>
            </div>
          </div>

          {/* Payment Safety Notice when payment is not captured */}
          {!isTerminal && !isPaymentCaptured && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Payment Protection Active: </span>
                {isPaymentBlocked
                  ? `Order payment is ${order.paymentStatus}. Fulfillment transitions are disabled.`
                  : `Order payment is currently ${order.paymentStatus}. Processing, dispatch (SHIPPED), and delivery (DELIVERED) require CAPTURED payment status.`}
              </div>
            </div>
          )}

          {isTerminal ? (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-[#E8DECB] text-xs text-[#68756E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>
                  This order is in a terminal status (<span className="font-bold text-[#1C1C1C]">{order.status}</span>). Fulfillment state cannot be moved backwards.
                </span>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canMarkReturnReceived && (
                    <button
                      type="button"
                      disabled={isUpdating || isRefunding}
                      onClick={() => executeStatusUpdate('DELIVERED', 'RETURNED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#123B2A] bg-white hover:bg-[#F7F1E5] text-[#123B2A] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#C6A15B]" />
                      <span>{isUpdating ? 'Updating...' : 'Mark Return Received'}</span>
                    </button>
                  )}

                  {isRefundEligible && (
                    <button
                      type="button"
                      disabled={isRefunding || isUpdating}
                      onClick={() => setShowRefundModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isRefunding ? 'Processing Refund...' : 'Refund Payment'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {order.status === 'PENDING' && !isPaymentBlocked && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => executeStatusUpdate('CONFIRMED')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C6A15B]" />
                    <span>{isUpdating ? 'Updating...' : 'Confirm Order'}</span>
                  </button>
                )}

                {order.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={isUpdating || !isPaymentCaptured}
                    onClick={() => executeStatusUpdate('PROCESSING')}
                    title={!isPaymentCaptured ? 'Requires CAPTURED payment status' : undefined}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                  >
                    <Play className="w-4 h-4 text-[#C6A15B]" />
                    <span>{isUpdating ? 'Updating...' : 'Start Processing'}</span>
                  </button>
                )}

                {order.status === 'PROCESSING' && (
                  <button
                    type="button"
                    disabled={isUpdating || !isPaymentCaptured}
                    onClick={() => executeStatusUpdate('SHIPPED', 'SHIPPED')}
                    title={!isPaymentCaptured ? 'Requires CAPTURED payment status' : undefined}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                  >
                    <Truck className="w-4 h-4 text-[#C6A15B]" />
                    <span>{isUpdating ? 'Updating...' : 'Mark Shipped'}</span>
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    type="button"
                    disabled={isUpdating || !isPaymentCaptured}
                    onClick={() => executeStatusUpdate('DELIVERED', 'DELIVERED')}
                    title={!isPaymentCaptured ? 'Requires CAPTURED payment status' : undefined}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C6A15B]" />
                    <span>{isUpdating ? 'Updating...' : 'Mark Delivered'}</span>
                  </button>
                )}

                {canCancel && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setShowCancelModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              {/* Status Select Form for Granular Inspection / Forward Transition */}
              <form
                onSubmit={handleUpdateSubmit}
                className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-[#E8DECB]"
              >
                <div className="flex-1 w-full">
                  <label
                    htmlFor="admin-order-status-select"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
                  >
                    Transition Order Status (Forward-Only):
                  </label>
                  <select
                    id="admin-order-status-select"
                    value={targetStatus}
                    onChange={(e) => handleOrderStatusSelectChange(e.target.value as OrderStatus)}
                    className="w-full py-2 px-3 rounded-lg border border-[#E8DECB] bg-white text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
                  >
                    <option value={order.status}>{order.status} (Current)</option>
                    {allowedNextStatuses.map((st) => (
                      <option key={st} value={st}>
                        → {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 w-full">
                  <label
                    htmlFor="admin-shipping-status-select"
                    className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
                  >
                    Synchronized Shipping Status:
                  </label>
                  <select
                    id="admin-shipping-status-select"
                    value={targetShippingStatus}
                    onChange={(e) => setTargetShippingStatus(e.target.value as ShippingStatus)}
                    className="w-full py-2 px-3 rounded-lg border border-[#E8DECB] bg-white text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
                  >
                    <option value="PENDING">PENDING (Awaiting Dispatch)</option>
                    <option value="SHIPPED">SHIPPED (In Transit)</option>
                    <option value="DELIVERED">DELIVERED (At Doorstep)</option>
                    <option value="RETURNED">RETURNED (Returned to Pantry)</option>
                  </select>
                </div>

                <div className="w-full sm:w-auto self-end pt-2 sm:pt-0">
                  <button
                    type="submit"
                    disabled={
                      isUpdating ||
                      (targetStatus === order.status &&
                        targetShippingStatus === order.shippingStatus)
                    }
                    className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  >
                    {isUpdating ? 'Saving...' : 'Apply Transition'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Order Items & Payment + Customer & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Order Items & Payment Details (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#E8DECB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#123B2A]" />
              <h2 className="font-serif text-lg font-bold text-[#092218]">Order Items</h2>
            </div>
            <span className="text-xs text-[#68756E] font-semibold">
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                <tr>
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Unit Price</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-6 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DECB]/60">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCFAF5] transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#1C1C1C] block text-sm">
                          {item.productName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#68756E]">
                          {item.product?.weight && <span>{item.product.weight}g</span>}
                          {item.product?.category && <span>• {item.product.category}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-[#123B2A]">
                      {item.product?.sku || '—'}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-[#1C1C1C]">
                      ₹{item.price}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-[#123B2A]">
                      × {item.quantity}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#123B2A]">
                      ₹{item.subtotal ?? item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Safe Payment Section (Section 5: Read-Only + Refund Ledger) */}
          <div className="p-6 border-t border-[#E8DECB] bg-[#FCFAF5]/60 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A]">
                <CreditCard className="w-4 h-4 text-[#C6A15B]" />
                <span>Payment &amp; Refund Ledger (Server-Authoritative)</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.paymentStatus} type="payment" />
                {isRefundEligible && (
                  <button
                    type="button"
                    disabled={isRefunding}
                    onClick={() => setShowRefundModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Refund Payment</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-[#E8DECB]">
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Payment Status</span>
                <span className="font-bold text-[#1C1C1C]">{order.paymentStatus}</span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Provider</span>
                <span className="font-bold text-[#1C1C1C]">
                  {primaryPayment?.provider || 'RAZORPAY'}
                </span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Razorpay Order ID</span>
                <span className="font-mono font-bold text-[#123B2A] break-all">
                  {order.razorpayOrderId || primaryPayment?.providerOrderId || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Razorpay Payment ID</span>
                <span className="font-mono font-bold text-[#123B2A] break-all">
                  {primaryPayment?.providerPaymentId || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Captured Amount</span>
                <span className="font-bold text-[#123B2A]">₹{capturedAmount}</span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Verification</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {primaryPayment?.signatureVerified ? 'HMAC Verified' : 'Gateway Managed'}
                </span>
              </div>
              {previouslyRefundedAmount > 0 && (
                <>
                  <div>
                    <span className="text-[#68756E] text-[10px] uppercase block">Refunded Amount</span>
                    <span className="font-bold text-red-700">₹{previouslyRefundedAmount}</span>
                  </div>
                  <div>
                    <span className="text-[#68756E] text-[10px] uppercase block">Refund ID</span>
                    <span className="font-mono font-bold text-[#1C1C1C] break-all">
                      {refundSummary?.latestRefund?.refundReference || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#68756E] text-[10px] uppercase block">Refund Date</span>
                    <span className="font-semibold text-[#1C1C1C]">
                      {refundSummary?.latestRefund?.createdAt
                        ? new Date(refundSummary.latestRefund.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Shipping Address & Financial Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8DECB]">
              <UserIcon className="w-4 h-4 text-[#123B2A]" />
              <h2 className="font-serif text-base font-bold text-[#092218]">Customer</h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Name</span>
                <span className="font-bold text-[#1C1C1C] text-sm">
                  {order.user?.name || 'Customer'}
                </span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Email</span>
                <span className="font-semibold text-[#123B2A] break-all">
                  {order.user?.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Phone</span>
                <span className="font-semibold text-[#1C1C1C]">
                  {order.user?.phone || order.shippingAddress?.phone || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8DECB]">
              <MapPin className="w-4 h-4 text-[#123B2A]" />
              <h2 className="font-serif text-base font-bold text-[#092218]">Shipping Address</h2>
            </div>

            {order.shippingAddress ? (
              <div className="space-y-2 text-xs text-[#68756E]">
                <div>
                  <span className="text-[10px] uppercase block text-[#68756E]">Recipient Name</span>
                  <p className="font-bold text-[#1C1C1C] text-sm">
                    {order.shippingAddress.fullName || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase block text-[#68756E]">Address</span>
                  <p className="text-[#1C1C1C]">
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2
                      ? `, ${order.shippingAddress.addressLine2}`
                      : ''}
                  </p>
                  {order.shippingAddress.landmark && (
                    <p className="text-[11px] italic">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] uppercase block text-[#68756E]">City</span>
                    <span className="font-semibold text-[#1C1C1C]">
                      {order.shippingAddress.city || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block text-[#68756E]">State</span>
                    <span className="font-semibold text-[#1C1C1C]">
                      {order.shippingAddress.state || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block text-[#68756E]">Pincode</span>
                    <span className="font-bold text-[#1C1C1C]">
                      {order.shippingAddress.postalCode || '—'}
                    </span>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] uppercase block text-[#68756E]">Phone</span>
                  <span className="font-semibold text-[#123B2A]">
                    {order.shippingAddress.phone || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#68756E]">No shipping address recorded.</p>
            )}
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-3 text-xs">
            <h2 className="font-serif text-base font-bold text-[#092218] pb-2 border-b border-[#E8DECB]">
              Financial Summary
            </h2>

            <div className="space-y-2 text-[#68756E]">
              <div className="flex justify-between">
                <span>Subtotal ({order.items.length} items)</span>
                <span className="font-bold text-[#1C1C1C]">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  Discount
                  {order.couponCode && (
                    <span className="ml-1.5 font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                      {order.couponCode}
                    </span>
                  )}
                </span>
                <span className="font-bold text-emerald-700">
                  {order.discountAmount ? `-₹${order.discountAmount}` : '₹0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-[#1C1C1C]">
                  {order.shippingAmount === 0 || !order.shippingAmount ? (
                    <span className="text-[#123B2A]">FREE (₹0)</span>
                  ) : (
                    `₹${order.shippingAmount}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-[#1C1C1C] pt-3 border-t border-[#E8DECB]">
                <span>Total</span>
                <span className="text-lg text-[#123B2A]">₹{order.totalAmount}</span>
              </div>
              {previouslyRefundedAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-red-700 pt-2 border-t border-[#E8DECB]/60">
                  <span>Refunded to Customer</span>
                  <span>₹{previouslyRefundedAmount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Cancel Order Confirmation Dialog (Section 8) */}
      <ConfirmDialog
        isOpen={showCancelModal}
        title="Cancel this order?"
        message="Please review the order details below before confirming cancellation:"
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        isDestructive
        isLoading={isUpdating}
        onConfirm={() => executeStatusUpdate('CANCELLED')}
        onCancel={() => {
          setShowCancelModal(false);
          setTargetStatus(order.status);
        }}
      >
        <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[#68756E]">Order Number:</span>
            <span className="font-mono font-bold text-[#092218]">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Customer:</span>
            <span className="font-bold text-[#1C1C1C]">
              {order.user?.name || 'Customer'} ({order.user?.email || '—'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Total Amount:</span>
            <span className="font-extrabold text-[#123B2A]">₹{order.totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Current Status:</span>
            <span className="font-bold text-[#1C1C1C]">{order.status}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold text-[11px] space-y-1">
          <p>Warning: Cancellation is irreversible and cannot be undone.</p>
          {order.paymentStatus === 'CAPTURED' && (
            <p className="font-bold text-amber-900 bg-amber-100/80 px-2 py-1 rounded mt-1">
              Payment captured — refund requires separate refund workflow.
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* Explicit Refund Payment Confirmation Dialog (Section 10 Requirement) */}
      <ConfirmDialog
        isOpen={showRefundModal}
        title="Confirm Customer Refund"
        message="Verify the authoritative payment and refund details before issuing a Razorpay refund:"
        confirmLabel={isRefunding ? 'Processing...' : `Refund ₹${remainingRefundableAmount}`}
        cancelLabel="Cancel"
        isDestructive
        isLoading={isRefunding}
        onConfirm={executeRefund}
        onCancel={() => {
          if (!isRefunding) {
            setShowRefundModal(false);
          }
        }}
      >
        <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[#68756E]">Order Number:</span>
            <span className="font-mono font-bold text-[#092218]">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Customer:</span>
            <span className="font-bold text-[#1C1C1C]">
              {order.user?.name || 'Customer'} ({order.user?.email || '—'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Original Payment:</span>
            <span className="font-mono font-bold text-[#123B2A]">
              {primaryPayment?.providerPaymentId || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Captured Amount:</span>
            <span className="font-bold text-[#1C1C1C]">₹{capturedAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Previously Refunded:</span>
            <span className="font-bold text-[#1C1C1C]">₹{previouslyRefundedAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68756E]">Refund Amount:</span>
            <span className="font-extrabold text-red-700">₹{remainingRefundableAmount}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#E8DECB]">
            <span className="text-[#68756E]">Remaining Refundable:</span>
            <span className="font-bold text-[#123B2A]">₹{remainingRefundableAmount}</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-refund-reason"
            className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1"
          >
            Refund Reason / Note (Optional):
          </label>
          <input
            id="admin-refund-reason"
            type="text"
            maxLength={500}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            disabled={isRefunding}
            placeholder="e.g., Order cancelled prior to dispatch / Returned item verified"
            className="w-full py-2 px-3 rounded-lg border border-[#E8DECB] bg-white text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
          />
        </div>

        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-bold text-[11px] leading-relaxed">
          This action sends money back to the customer&apos;s original payment method. Refunds cannot be undone from this dashboard.
        </div>
      </ConfirmDialog>
    </div>
  );
};

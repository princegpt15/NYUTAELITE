// src/pages/Orders.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';
import { authService } from '../services/auth';
import { orderService } from '../services/orders';
import { retentionService } from '../services/retention';
import {
  trackAuthoritativePurchase,
  trackAuthoritativeRefund,
  trackBeginReorder,
} from '../services/analytics';
import type { Order } from '../types';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderFeedback, setReorderFeedback] = useState<{
    orderId: string;
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      orderService
        .getOrders()
        .then((data) => {
          setOrders(data);
          data.forEach((order) => {
            if (order.paymentStatus === 'CAPTURED' && order.status !== 'CANCELLED') {
              void trackAuthoritativePurchase(order);
            }

            const refundPayments =
              order.payments?.filter((p) => p.status === 'REFUNDED') || [];
            if (refundPayments.length > 0) {
              refundPayments.forEach((rp) => {
                void trackAuthoritativeRefund({
                  orderId: order.id,
                  transactionId: order.orderNumber || order.id,
                  refundId: rp.id,
                  value: rp.amount,
                  items: order.items || [],
                });
              });
            } else if (order.paymentStatus === 'REFUNDED') {
              void trackAuthoritativeRefund({
                orderId: order.id,
                transactionId: order.orderNumber || order.id,
                value: order.totalAmount,
                items: order.items || [],
              });
            }
          });
        })
        .catch((err) => console.error('Failed to load orders:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
    setReorderFeedback(null);
    try {
      const res = await retentionService.reorder(order.id);
      trackBeginReorder(order.id, res.totalAdded, order.totalAmount);
      if (res.totalAdded > 0) {
        setReorderFeedback({
          orderId: order.id,
          type: 'success',
          text: `Added ${res.totalAdded} item(s) to your cart with current prices! Redirecting to cart...`,
        });
        setTimeout(() => {
          navigate('/cart');
        }, 1000);
      } else {
        setReorderFeedback({
          orderId: order.id,
          type: 'error',
          text: 'None of the items from this order are currently available in stock.',
        });
      }
    } catch (err: any) {
      setReorderFeedback({
        orderId: order.id,
        type: 'error',
        text: err?.message || 'Failed to reorder items',
      });
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'SHIPPED':
        return 'bg-emerald-50 text-[#123B2A] border border-[#123B2A]/30';
      case 'DELIVERED':
        return 'bg-[#F7F1E5] text-[#123B2A] border border-[#C6A15B]/40';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
  };

  interface TimelineStep {
    label: string;
    active: boolean;
    completed: boolean;
    isError?: boolean;
    date?: string | null;
  }

  // Authoritative Timeline Step Determiner (Zero invented timestamps)
  const getTimelineSteps = (order: Order): TimelineStep[] => {
    const isCancelled = order.status === 'CANCELLED';
    const isPaid = order.paymentStatus === 'CAPTURED';
    const isProcessing =
      order.status === 'PROCESSING' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED';
    const isShipped = order.shippingStatus === 'SHIPPED' || order.status === 'DELIVERED';
    const isDelivered =
      order.shippingStatus === 'DELIVERED' || order.status === 'DELIVERED';

    if (isCancelled) {
      return [
        { label: 'Placed', active: true, completed: true, date: order.createdAt },
        { label: 'Cancelled', active: true, completed: true, isError: true, date: order.updatedAt },
      ];
    }

    return [
      {
        label: 'Order Placed',
        active: true,
        completed: true,
        date: order.createdAt,
      },
      {
        label: 'Payment Confirmed',
        active: isPaid,
        completed: isPaid,
        date: isPaid ? order.createdAt : null,
      },
      {
        label: 'Processing in Pantry',
        active: isProcessing,
        completed: isProcessing,
        date: null,
      },
      {
        label: 'Shipped (Express)',
        active: isShipped,
        completed: isShipped,
        date: null,
      },
      {
        label: 'Delivered',
        active: isDelivered,
        completed: isDelivered,
        date: isDelivered ? order.updatedAt : null,
      },
    ];
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-12 lg:py-16">
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
              YOUR PANTRY ACCOUNT
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#092218] mt-1">
              Order History &amp; Tracking
            </h1>
            <p className="text-xs sm:text-sm text-[#68756E] mt-0.5">
              {user ? `Account: ${user.fullName} (${user.email})` : 'Viewing household orders'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/account"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#123B2A] text-[#123B2A] hover:bg-[#123B2A] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              My Account
            </Link>
            <Link
              to="/#pantry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs w-fit"
            >
              <span>Browse Makhana</span>
              <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-xs text-[#68756E] border border-[#E8DECB] space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C6A15B] animate-spin mx-auto" />
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DECB] space-y-3">
            <ShoppingBag className="w-10 h-10 text-[#68756E]/40 mx-auto" />
            <h2 className="font-serif text-2xl font-bold text-[#1C1C1C]">No Orders Yet</h2>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              You have not placed any orders yet. Discover our fresh Bihar makhana pantry packs.
            </p>
            <Link
              to="/#pantry"
              className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[#092218] transition-colors mt-2"
            >
              Shop Makhana Packs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const itemsSummary =
                order.items && order.items.length > 0
                  ? order.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')
                  : 'Makhana Pack';

              const refundPayments =
                order.payments?.filter((p) => p.status === 'REFUNDED') || [];
              const totalRefundedAmount = Number(
                refundPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
              );
              const hasRefund =
                order.paymentStatus === 'REFUNDED' || totalRefundedAmount > 0;
              const refundDisplayAmount =
                totalRefundedAmount > 0 ? totalRefundedAmount : order.totalAmount;
              const latestRefundDate = refundPayments[0]?.createdAt || order.updatedAt;
              const formattedRefundDate = latestRefundDate
                ? new Date(latestRefundDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : null;

              const timelineSteps = getTimelineSteps(order);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-6 border border-[#E8DECB] shadow-xs space-y-5"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8DECB] gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#E8DECB]">
                        <Package className="w-5 h-5 text-[#C6A15B]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#1C1C1C] font-mono">
                          {order.orderNumber}
                        </h3>
                        <p className="text-xs text-[#68756E]">
                          Placed on {formattedDate}
                          {order.confirmationEmailSent ? (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Confirmation email sent
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusBadgeColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-lg font-extrabold text-[#123B2A]">
                        ₹{order.totalAmount}
                      </span>
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={reorderingId === order.id}
                        className="px-3.5 py-1.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                        title="Reorder items with real-time price & stock validation"
                      >
                        {reorderingId === order.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>Buy Again</span>
                      </button>
                    </div>
                  </div>

                  {/* Reorder feedback notification */}
                  {reorderFeedback && reorderFeedback.orderId === order.id && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        reorderFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-rose-50 text-rose-900 border-rose-200'
                      }`}
                    >
                      {reorderFeedback.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{reorderFeedback.text}</span>
                    </div>
                  )}

                  {/* Authoritative Order Tracking Timeline */}
                  <div className="bg-[#FCFAF5] p-4 rounded-xl border border-[#E8DECB]/70 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#68756E] block">
                      Authoritative Fulfillment Timeline
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {timelineSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col p-2 rounded-lg border text-xs ${
                            step.isError
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : step.completed
                              ? 'bg-white border-[#C6A15B]/50 text-[#123B2A]'
                              : 'bg-white/50 border-gray-200 text-[#68756E]/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {step.isError ? (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : step.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            <span className="font-bold text-[11px] truncate">{step.label}</span>
                          </div>
                          {step.date ? (
                            <span className="text-[10px] text-[#68756E]">
                              {new Date(step.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              {step.completed ? 'Completed' : 'Pending'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-[#68756E] text-xs block">Order Items</span>
                      <span className="font-bold text-[#1C1C1C]">{itemsSummary}</span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-xs block">Payment Status</span>
                      <span className="font-bold text-[#123B2A] uppercase text-xs">
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-xs block">Shipping Status</span>
                      <span className="font-bold text-[#1C1C1C] uppercase text-xs">
                        {order.shippingStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-xs block">Delivery State</span>
                      <span className="font-bold text-[#123B2A] flex items-center gap-1.5 mt-0.5 text-xs">
                        <Truck className="w-4 h-4 text-[#C6A15B] shrink-0" />
                        {order.status === 'CANCELLED'
                          ? 'Order Cancelled'
                          : order.shippingStatus === 'RETURNED'
                          ? 'Returned to Pantry'
                          : order.shippingStatus === 'DELIVERED' || order.status === 'DELIVERED'
                          ? 'Delivered to Doorstep'
                          : order.shippingStatus === 'SHIPPED' || order.status === 'SHIPPED'
                          ? 'In Transit (Express Courier)'
                          : order.paymentStatus === 'CAPTURED'
                          ? 'Processing at Bihar Pantry'
                          : 'Awaiting Payment Confirmation'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown (Subtotal, Discount, Shipping, Total, Coupon Code) */}
                  <div className="pt-3 border-t border-[#E8DECB] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#FCFAF5]/70 p-3.5 rounded-xl border border-[#E8DECB]/50">
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                        Subtotal
                      </span>
                      <span className="font-bold text-[#1C1C1C]">₹{order.subtotal}</span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                        Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {(order.discountAmount ?? 0) > 0 ? `-₹${order.discountAmount}` : '₹0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                        Shipping
                      </span>
                      <span className="font-bold text-[#1C1C1C]">
                        {(order.shippingAmount ?? 0) === 0 ? 'FREE' : `₹${order.shippingAmount}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                        Total Paid
                      </span>
                      <span className="font-extrabold text-[#123B2A]">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {hasRefund && (
                    <div className="pt-3 border-t border-[#E8DECB] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FCFAF5] p-3.5 rounded-xl">
                      <div>
                        <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                          Refund Status
                        </span>
                        <span className="font-bold text-emerald-700 uppercase">
                          {order.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'PARTIALLY REFUNDED'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                          Refund Amount
                        </span>
                        <span className="font-extrabold text-[#123B2A]">
                          ₹{refundDisplayAmount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#68756E] text-[10px] uppercase font-bold block">
                          Refund Date
                        </span>
                        <span className="font-semibold text-[#1C1C1C]">
                          {formattedRefundDate || formattedDate}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

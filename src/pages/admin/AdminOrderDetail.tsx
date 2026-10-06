// src/pages/admin/AdminOrderDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import type { AdminOrderDetail as AdminOrderDetailType } from '../../types/admin';
import type { OrderStatus, ShippingStatus } from '../../types';

export const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status mutation state
  const [targetStatus, setTargetStatus] = useState<OrderStatus | ''>('');
  const [targetShippingStatus, setTargetShippingStatus] = useState<ShippingStatus | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
      setError(err?.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const executeStatusUpdate = async (statusToSet: OrderStatus, shippingToSet?: ShippingStatus) => {
    if (!id || !order) return;
    setIsUpdating(true);
    setError(null);
    setUpdateSuccess(null);

    try {
      const updated = await adminService.updateOrderStatus(id, {
        orderStatus: statusToSet,
        shippingStatus: shippingToSet || targetShippingStatus || undefined,
      });
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status as OrderStatus,
              shippingStatus: updated.shippingStatus as ShippingStatus,
              updatedAt: updated.updatedAt,
            }
          : null
      );
      setTargetStatus(updated.status as OrderStatus);
      setTargetShippingStatus(updated.shippingStatus as ShippingStatus);
      setUpdateSuccess(`Order #${order.orderNumber} successfully updated to ${updated.status}.`);
      setShowCancelModal(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update order status. Please verify transition.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus || !order) return;

    // If changing to CANCELLED, require explicit confirmation modal
    if (targetStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
      setShowCancelModal(true);
      return;
    }

    executeStatusUpdate(targetStatus, targetShippingStatus || undefined);
  };

  if (loading) {
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
        <p className="text-xs text-[#68756E]">
          The requested order ID does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/admin/orders"
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back link & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <button
          type="button"
          onClick={fetchOrderDetail}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#F7F1E5] text-xs font-bold text-[#123B2A] transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Details</span>
        </button>
      </div>

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

      {/* Order Header Summary Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8DECB]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                ORDER DETAILS
              </span>
              <span className="text-xs text-[#68756E]">•</span>
              <span className="text-xs text-[#68756E] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Placed on {formattedCreated}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
              Order #{order.orderNumber}
            </h1>
            <p className="text-[11px] text-[#68756E] mt-0.5">
              Internal ID: <span className="font-mono">{order.id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
              <span className="text-[10px] text-[#68756E] uppercase block">Total Amount</span>
              <span className="text-2xl font-serif font-black text-[#123B2A]">
                ₹{order.totalAmount}
              </span>
            </div>
            <StatusBadge status={order.paymentStatus} type="payment" className="text-xs px-3 py-1" />
            <StatusBadge status={order.status} type="order" className="text-xs px-3 py-1" />
          </div>
        </div>

        {/* Fulfillment Status Control Bar */}
        <div className="p-5 rounded-xl bg-[#F7F1E5]/60 border border-[#E8DECB] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#123B2A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#123B2A]">
                Fulfillment &amp; Shipping Status Controls
              </h2>
            </div>
            <span className="text-[11px] text-[#68756E]">
              Last updated: {formattedUpdated}
            </span>
          </div>

          {isTerminal ? (
            <div className="p-3 bg-white rounded-lg border border-[#E8DECB] text-xs text-[#68756E]">
              This order is in a terminal status (<span className="font-bold text-[#1C1C1C]">{order.status}</span>). Fulfillment state cannot be reverted.
            </div>
          ) : (
            <form onSubmit={handleUpdateSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1">
                  Update Fulfillment Status:
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  className="w-full py-2 px-3 rounded-lg border border-[#E8DECB] bg-white text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED (Order Verified)</option>
                  <option value="PROCESSING">PROCESSING (Packing in Bihar Pantry)</option>
                  <option value="SHIPPED">SHIPPED (Handed to Courier)</option>
                  <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                  <option value="CANCELLED">CANCELLED (Cancel Order)</option>
                </select>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1">
                  Update Shipping Logistics:
                </label>
                <select
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
                  disabled={isUpdating || (targetStatus === order.status && targetShippingStatus === order.shippingStatus)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  {isUpdating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Main Grid: Order Items + Customer & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Order Items Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#E8DECB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#123B2A]" />
              <h2 className="font-serif text-lg font-bold text-[#092218]">Order Items</h2>
            </div>
            <span className="text-xs text-[#68756E] font-semibold">
              {order.items.length} {order.items.length === 1 ? 'pack' : 'packs'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                <tr>
                  <th className="py-3 px-6">Product Details</th>
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
                          {item.product?.sku && (
                            <span className="font-mono bg-[#F7F1E5] px-1.5 py-0.2 rounded text-[#123B2A]">
                              SKU: {item.product.sku}
                            </span>
                          )}
                          {item.product?.weight && (
                            <span>{item.product.weight}g</span>
                          )}
                          {item.product?.category && (
                            <span>• {item.product.category}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-[#1C1C1C]">
                      ₹{item.price}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-[#123B2A]">
                      × {item.quantity}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#123B2A]">
                      ₹{item.subtotal || item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Safe Payment Audit Metadata */}
          <div className="p-6 border-t border-[#E8DECB] bg-[#FCFAF5]/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A]">
              <CreditCard className="w-4 h-4 text-[#C6A15B]" />
              <span>Payment Gateway Transaction Log (Read-Only)</span>
            </div>

            {order.payments && order.payments.length > 0 ? (
              <div className="space-y-2">
                {order.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white rounded-xl border border-[#E8DECB] text-xs grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase block">Gateway Provider</span>
                      <span className="font-bold text-[#1C1C1C]">{p.provider}</span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase block">Provider Payment ID</span>
                      <span className="font-mono font-bold text-[#123B2A] truncate block">
                        {p.providerPaymentId || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#68756E] text-[10px] uppercase block">Signature Verification</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {p.signatureVerified ? 'HMAC SHA-256 Verified' : 'Pending Gateway'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#68756E]">
                Payment Status:{' '}
                <span className="font-bold text-[#123B2A]">{order.paymentStatus}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Customer Info & Financial Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8DECB]">
              <UserIcon className="w-4 h-4 text-[#123B2A]" />
              <h2 className="font-serif text-base font-bold text-[#092218]">Customer Profile</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Full Name</span>
                <span className="font-bold text-[#1C1C1C] text-sm">
                  {order.user?.name || 'Customer'}
                </span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Email Address</span>
                <span className="font-semibold text-[#123B2A]">{order.user?.email || '—'}</span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Phone Number</span>
                <span className="font-semibold text-[#1C1C1C]">{order.user?.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[#68756E] text-[10px] uppercase block">Account Role</span>
                <span className="bg-[#F7F1E5] text-[#123B2A] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {order.user?.role || 'CUSTOMER'}
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
              <div className="space-y-1.5 text-xs text-[#68756E]">
                <p className="font-bold text-[#1C1C1C] text-sm">
                  {order.shippingAddress.fullName}
                </p>
                <p className="font-semibold text-[#123B2A]">
                  Ph: {order.shippingAddress.phone}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  <span className="font-bold text-[#1C1C1C]">
                    {order.shippingAddress.postalCode}
                  </span>
                </p>
                {order.shippingAddress.landmark && (
                  <p className="text-[11px] italic">Landmark: {order.shippingAddress.landmark}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#68756E]">No explicit shipping address recorded.</p>
            )}
          </div>

          {/* Order Financial Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-3 text-xs">
            <h2 className="font-serif text-base font-bold text-[#092218] pb-2 border-b border-[#E8DECB]">
              Payment Summary
            </h2>

            <div className="space-y-2 text-[#68756E]">
              <div className="flex justify-between">
                <span>Subtotal ({order.items.length} items)</span>
                <span className="font-bold text-[#1C1C1C]">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-bold text-[#1C1C1C]">
                  {order.shippingAmount === 0 || !order.shippingAmount ? (
                    <span className="text-[#123B2A]">FREE</span>
                  ) : (
                    `₹${order.shippingAmount}`
                  )}
                </span>
              </div>
              {order.discountAmount ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Pantry Discount</span>
                  <span className="font-bold">-₹{order.discountAmount}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-black text-[#1C1C1C] pt-3 border-t border-[#E8DECB]">
                <span>Total Amount</span>
                <span className="text-lg text-[#123B2A]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelModal}
        title="Cancel Order?"
        message={`Are you sure you want to cancel order #${order.orderNumber}? This will mark fulfillment as CANCELLED.`}
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        isDestructive
        isLoading={isUpdating}
        onConfirm={() => executeStatusUpdate('CANCELLED')}
        onCancel={() => {
          setShowCancelModal(false);
          setTargetStatus(order.status);
        }}
      />
    </div>
  );
};

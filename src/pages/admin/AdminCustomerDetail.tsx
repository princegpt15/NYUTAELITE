// src/pages/admin/AdminCustomerDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShoppingBag,
  IndianRupee,
  MapPin,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  Lock,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { ApiError } from '../../services/api';
import { StatusBadge } from '../../components/admin/StatusBadge';
import type { AdminCustomerDetail as AdminCustomerDetailType } from '../../types/admin';

function resolveCustomerDetailError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You do not have permission to access customer information.';
      case 404:
        return 'Customer not found.';
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

export const AdminCustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getCustomerById(id);
      setCustomer(data);
    } catch (err: unknown) {
      setError(resolveCustomerDetailError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerDetail();
  }, [fetchCustomerDetail]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  const formatDateTime = (dateStr: string) => {
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
      <div className="space-y-6 max-w-6xl mx-auto" aria-busy="true" aria-label="Loading customer details">
        {/* Back link skeleton */}
        <div className="h-5 bg-[#F7F1E5] rounded w-36 animate-pulse" />

        {/* Profile Header Skeleton */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F1E5]" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-[#F7F1E5] rounded w-56" />
              <div className="h-4 bg-[#F7F1E5] rounded w-40" />
            </div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-3 animate-pulse"
            >
              <div className="w-9 h-9 bg-[#F7F1E5] rounded-xl" />
              <div className="h-3 bg-[#F7F1E5] rounded w-24" />
              <div className="h-7 bg-[#F7F1E5] rounded w-32" />
            </div>
          ))}
        </div>

        {/* Order History Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4 animate-pulse">
          <div className="h-5 bg-[#F7F1E5] rounded w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-[#F7F1E5] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div
        role="alert"
        className="bg-white p-8 rounded-2xl border border-red-200 shadow-2xs text-center space-y-4 max-w-lg mx-auto my-12"
      >
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#1C1C1C]">
          {error === 'Customer not found.' ? 'Customer not found.' : 'Unable to Load Customer'}
        </h1>
        <p className="text-xs text-[#68756E]">
          {error || 'Customer not found.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-2 bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-[#092218] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Customers</span>
          </Link>
          {error !== 'Customer not found.' && (
            <button
              type="button"
              onClick={fetchCustomerDetail}
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

  const displayName = customer.name?.trim() || 'Registered Customer';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const totalOrders = customer.orderCount ?? customer._count?.orders ?? 0;
  const lifetimeSpend = customer.lifetimeSpend ?? 0;
  const recentOrders = customer.orders || [];
  const addresses = customer.addresses || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Action Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#092218] transition-colors w-fit focus:outline-none focus:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F1E5] border border-[#E8DECB] text-[11px] font-bold text-[#68756E]">
            <Lock className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
            <span>Read-Only Profile</span>
          </span>

          <button
            type="button"
            onClick={fetchCustomerDetail}
            disabled={loading}
            aria-label="Refresh customer profile"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E8DECB] bg-white hover:bg-[#F7F1E5] text-xs font-bold text-[#123B2A] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Customer Profile Header Card */}
      <section
        aria-labelledby="customer-profile-heading"
        className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DECB] shadow-2xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-[#123B2A] border border-[#C6A15B]/40 text-[#C6A15B] font-serif font-black text-xl flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                  CUSTOMER PROFILE
                </span>
                <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border tracking-wider bg-[#F7F1E5] text-[#123B2A] border-[#C6A15B]/50">
                  {customer.role}
                </span>
                {customer.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                    Verified Account
                  </span>
                )}
              </div>
              <h1
                id="customer-profile-heading"
                className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] truncate"
              >
                {displayName}
              </h1>
              <p className="text-xs text-[#68756E] truncate">{customer.email}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-2 text-xs text-[#68756E] border-t md:border-t-0 pt-4 md:pt-0 border-[#E8DECB]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
              <span>
                Joined: <strong className="text-[#1C1C1C]">{formatDate(customer.createdAt)}</strong>
              </span>
            </div>
            {customer.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
                <span>
                  Last Updated: <strong className="text-[#1C1C1C]">{formatDateTime(customer.updatedAt)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Summary Metrics & Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Orders Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#68756E]">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-center text-[#123B2A]">
              <ShoppingBag className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-black text-[#092218]">
              {totalOrders}
            </span>
            <p className="text-[11px] text-[#68756E] mt-1">
              All-time orders placed by this customer
            </p>
          </div>
        </div>

        {/* Server-Authoritative Lifetime Spend Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#68756E]">
              Lifetime Spend
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-center text-[#123B2A]">
              <IndianRupee className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl font-black text-[#123B2A]">
              {formatCurrency(lifetimeSpend)}
            </span>
            <p className="text-[11px] text-[#68756E] mt-1">
              Authoritative non-cancelled order total
            </p>
          </div>
        </div>

        {/* Contact Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#68756E]">
              Contact Information
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F7F1E5] border border-[#E8DECB] flex items-center justify-center text-[#123B2A]">
              <UserIcon className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center gap-2.5 text-[#1C1C1C]">
              <Mail className="w-4 h-4 text-[#C6A15B] shrink-0" aria-hidden="true" />
              <span className="font-medium truncate" title={customer.email}>
                {customer.email}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[#1C1C1C]">
              <Phone className="w-4 h-4 text-[#C6A15B] shrink-0" aria-hidden="true" />
              <span className="font-medium">
                {customer.phone || 'No phone number on file'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Shipping Addresses Section (Supported by Backend) */}
      {addresses.length > 0 && (
        <section
          aria-labelledby="customer-addresses-heading"
          className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E8DECB] pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
              <h2
                id="customer-addresses-heading"
                className="font-serif text-lg font-bold text-[#092218]"
              >
                Saved Shipping Addresses ({addresses.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr, idx) => (
              <div
                key={addr.id || idx}
                className="p-4 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#092218] text-sm">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F1E5] text-[#123B2A] border border-[#C6A15B]/50">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-[#1C1C1C]">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                </p>
                {addr.landmark && (
                  <p className="text-[#68756E] text-[11px]">Landmark: {addr.landmark}</p>
                )}
                <p className="text-[#1C1C1C] font-semibold">
                  {addr.city}, {addr.state} — {addr.postalCode}
                </p>
                <p className="text-[#68756E]">{addr.country}</p>
                {addr.phone && (
                  <p className="text-[#68756E] pt-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#C6A15B]" aria-hidden="true" />
                    <span>{addr.phone}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Order History Section */}
      <section
        aria-labelledby="customer-orders-heading"
        className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden"
      >
        <div className="p-6 border-b border-[#E8DECB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
              SERVER-AUTHORITATIVE LEDGER
            </span>
            <h2
              id="customer-orders-heading"
              className="font-serif text-xl font-bold text-[#092218]"
            >
              Recent Orders
            </h2>
          </div>
          <span className="text-xs text-[#68756E]">
            Showing {recentOrders.length} of {totalOrders} total {totalOrders === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center mx-auto border border-[#E8DECB]">
              <ShoppingBag className="w-5 h-5 text-[#C6A15B]" aria-hidden="true" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#092218]">No orders yet</h3>
            <p className="text-xs text-[#68756E] max-w-xs mx-auto">
              This customer has not placed any orders on the platform yet.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Order History Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                  <tr>
                    <th scope="col" className="py-3.5 px-6">Order ID</th>
                    <th scope="col" className="py-3.5 px-4">Date</th>
                    <th scope="col" className="py-3.5 px-4">Order Status</th>
                    <th scope="col" className="py-3.5 px-4">Payment Status</th>
                    <th scope="col" className="py-3.5 px-4">Order Total</th>
                    <th scope="col" className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DECB]/60">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FCFAF5] transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-[#092218]">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="hover:text-[#C6A15B] transition-colors focus:outline-none focus:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-[#68756E] whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} type="order" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.paymentStatus} type="payment" />
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#123B2A] whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          aria-label={`View Order #${order.orderNumber}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#123B2A] hover:text-white text-[#123B2A] text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>View Order</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Order Cards */}
            <div className="md:hidden divide-y divide-[#E8DECB]">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-3 hover:bg-[#FCFAF5] transition-colors">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="font-mono font-bold text-sm text-[#092218] hover:text-[#C6A15B]"
                    >
                      #{order.orderNumber}
                    </Link>
                    <span className="font-extrabold text-sm text-[#123B2A]">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#68756E]">
                    Placed on {formatDateTime(order.createdAt)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} type="order" />
                    <StatusBadge status={order.paymentStatus} type="payment" />
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] hover:bg-[#123B2A] hover:text-white text-[#123B2A] text-xs font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Inspect Order #{order.orderNumber}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

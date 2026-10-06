// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Boxes,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { StatusBadge } from '../../components/admin/StatusBadge';
import type { AdminDashboardStats } from '../../types/admin';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading analytics dashboard">
        {/* Metric Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-3 animate-pulse"
            >
              <div className="w-8 h-8 bg-[#F7F1E5] rounded-xl" />
              <div className="h-4 bg-[#F7F1E5] rounded w-24" />
              <div className="h-8 bg-[#F7F1E5] rounded w-32" />
            </div>
          ))}
        </div>

        {/* Pipelines Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs h-44 animate-pulse" />
          <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs h-44 animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4 animate-pulse">
          <div className="h-6 bg-[#F7F1E5] rounded w-48" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[#F7F1E5] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        role="alert"
        className="bg-white p-8 rounded-2xl border border-red-200 shadow-2xs text-center space-y-4 max-w-lg mx-auto my-12"
      >
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-xl font-bold text-[#1C1C1C]">Unable to load analytics.</h2>
        <p className="text-xs text-[#68756E]">
          {error || 'Unable to load analytics.'}
        </p>
        <button
          type="button"
          onClick={fetchStats}
          className="inline-flex items-center gap-2 bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const paymentsPipeline = stats.paymentsByStatus || {
    pending: 0,
    authorized: 0,
    captured: 0,
    failed: 0,
    refunded: 0,
  };

  const outOfStockCount = stats.inventory.outOfStockProducts ?? 0;
  const newCustomers30d = stats.customers.newLast30Days ?? 0;

  return (
    <div className="space-y-8">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase block">
            LIVE PANTRY ANALYTICS
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-0.5">
            Operational Overview
          </h1>
          <p className="text-xs text-[#68756E] mt-0.5">
            {stats.revenueRule}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          aria-label="Refresh analytics data"
          className="inline-flex items-center gap-2 bg-white hover:bg-[#F7F1E5] border border-[#E8DECB] text-[#123B2A] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs w-fit focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68756E] uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/30">
              <IndianRupee className="w-4 h-4 text-[#C6A15B]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-[#092218]">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#68756E] pt-1 border-t border-[#E8DECB]/60">
            <span>{paymentsPipeline.captured} captured payments</span>
            {paymentsPipeline.failed > 0 && (
              <span className="text-red-700 font-bold">{paymentsPipeline.failed} failed</span>
            )}
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68756E] uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/30">
              <ShoppingBag className="w-4 h-4 text-[#123B2A]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-[#092218]">
            {stats.totalOrders}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-[#123B2A] pt-1 border-t border-[#E8DECB]/60">
            <span className="font-bold">
              {stats.ordersByStatus.confirmed + stats.ordersByStatus.processing}
            </span>
            <span className="text-[#68756E]">in fulfillment pipeline</span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68756E] uppercase tracking-wider">
              Registered Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/30">
              <Users className="w-4 h-4 text-[#123B2A]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-[#092218]">
            {stats.customers.total}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#68756E] pt-1 border-t border-[#E8DECB]/60">
            <span>Active customer accounts</span>
            {newCustomers30d > 0 && (
              <span className="text-[#123B2A] font-bold">+{newCustomers30d} (30d)</span>
            )}
          </div>
        </div>

        {/* Active Products & Inventory Health */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68756E] uppercase tracking-wider">
              Catalog &amp; Inventory
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center border border-[#C6A15B]/30">
              <Boxes className="w-4 h-4 text-[#123B2A]" aria-hidden="true" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-[#092218]">
            {stats.inventory.activeProducts}{' '}
            <span className="text-xs font-sans font-bold text-[#68756E]">Active SKUs</span>
          </p>
          <div className="pt-1 border-t border-[#E8DECB]/60 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
            {stats.inventory.lowStockProducts > 0 ? (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                {stats.inventory.lowStockProducts} low stock
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> All SKUs healthy
              </span>
            )}
            {outOfStockCount > 0 && (
              <span className="text-red-700 font-bold">{outOfStockCount} out of stock</span>
            )}
          </div>
        </div>
      </div>

      {/* Order Pipeline & Payment Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment Pipeline */}
        <section
          aria-labelledby="order-pipeline-heading"
          className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                FULFILLMENT LIFECYCLE
              </span>
              <h2 id="order-pipeline-heading" className="font-serif text-lg font-bold text-[#092218]">
                Order Pipeline
              </h2>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:underline"
            >
              <span>Manage Orders</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending</span>
              <span className="text-lg font-extrabold text-amber-950 block mt-0.5">
                {stats.ordersByStatus.pending}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Confirmed</span>
              <span className="text-lg font-extrabold text-blue-900 block mt-0.5">
                {stats.ordersByStatus.confirmed}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Processing</span>
              <span className="text-lg font-extrabold text-blue-900 block mt-0.5">
                {stats.ordersByStatus.processing}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Shipped</span>
              <span className="text-lg font-extrabold text-emerald-900 block mt-0.5">
                {stats.ordersByStatus.shipped}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F1E5] border border-[#C6A15B]/40 text-center">
              <span className="text-[10px] font-bold text-[#123B2A] uppercase block">Delivered</span>
              <span className="text-lg font-extrabold text-[#123B2A] block mt-0.5">
                {stats.ordersByStatus.delivered}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 text-center">
              <span className="text-[10px] font-bold text-red-700 uppercase block">Cancelled</span>
              <span className="text-lg font-extrabold text-red-900 block mt-0.5">
                {stats.ordersByStatus.cancelled}
              </span>
            </div>
          </div>
        </section>

        {/* Payment Gateway Pipeline */}
        <section
          aria-labelledby="payment-pipeline-heading"
          className="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B] block">
                RAZORPAY SETTLEMENT LEDGER
              </span>
              <h2 id="payment-pipeline-heading" className="font-serif text-lg font-bold text-[#092218]">
                Payment Pipeline
              </h2>
            </div>
            <Link
              to="/admin/payments"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:underline"
            >
              <span>Audit Payments</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F7F1E5] border border-[#C6A15B]/40 text-center">
              <span className="text-[10px] font-bold text-[#123B2A] uppercase block">Captured</span>
              <span className="text-lg font-extrabold text-[#123B2A] block mt-0.5">
                {paymentsPipeline.captured}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Authorized</span>
              <span className="text-lg font-extrabold text-blue-900 block mt-0.5">
                {paymentsPipeline.authorized}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending</span>
              <span className="text-lg font-extrabold text-amber-950 block mt-0.5">
                {paymentsPipeline.pending}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 text-center">
              <span className="text-[10px] font-bold text-red-700 uppercase block">Failed</span>
              <span className="text-lg font-extrabold text-red-900 block mt-0.5">
                {paymentsPipeline.failed}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50/40 border border-red-200 text-center">
              <span className="text-[10px] font-bold text-red-700 uppercase block">Refunded</span>
              <span className="text-lg font-extrabold text-red-900 block mt-0.5">
                {paymentsPipeline.refunded}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FCFAF5] border border-[#E8DECB] flex flex-col items-center justify-center text-center">
              <CreditCard className="w-4 h-4 text-[#C6A15B] mb-0.5" aria-hidden="true" />
              <span className="text-[10px] font-bold text-[#68756E] uppercase">Read-Only</span>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Orders Table */}
      <section
        aria-labelledby="recent-orders-heading"
        className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden"
      >
        <div className="p-6 border-b border-[#E8DECB] flex items-center justify-between">
          <div>
            <h2 id="recent-orders-heading" className="font-serif text-lg font-bold text-[#092218]">
              Recent Orders
            </h2>
            <p className="text-xs text-[#68756E]">Latest customer orders received in production</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#68756E]">
            No recent orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                <tr>
                  <th scope="col" className="py-3 px-4 sm:px-6">Order Number</th>
                  <th scope="col" className="py-3 px-4">Customer</th>
                  <th scope="col" className="py-3 px-4">Date</th>
                  <th scope="col" className="py-3 px-4">Total</th>
                  <th scope="col" className="py-3 px-4">Payment</th>
                  <th scope="col" className="py-3 px-4">Fulfillment</th>
                  <th scope="col" className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DECB]/60">
                {stats.recentOrders.map((order) => {
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-[#FCFAF5] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#092218]">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="hover:text-[#C6A15B] transition-colors"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        {order.user?.id ? (
                          <Link
                            to={`/admin/customers/${order.user.id}`}
                            className="font-bold text-[#1C1C1C] hover:text-[#123B2A] block truncate max-w-[160px]"
                          >
                            {order.user.name || 'Registered Customer'}
                          </Link>
                        ) : (
                          <span className="font-bold text-[#1C1C1C] block truncate max-w-[160px]">
                            {order.user?.name || 'Customer'}
                          </span>
                        )}
                        <span className="text-[11px] text-[#68756E] block truncate max-w-[160px]">
                          {order.user?.email || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#68756E] whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#123B2A] whitespace-nowrap">
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.paymentStatus} type="payment" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} type="order" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          aria-label={`View Order #${order.orderNumber}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#123B2A] hover:text-white text-[#123B2A] text-xs font-bold transition-all"
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
        )}
      </section>
    </div>
  );
};

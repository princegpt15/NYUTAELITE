// src/pages/admin/AdminOrders.tsx
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
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { StatusBadge } from '../../components/admin/StatusBadge';
import type {
  AdminOrderListItem,
  AdminPagination,
  AdminOrdersFilterParams,
} from '../../types/admin';
import type { OrderStatus, PaymentStatus, ShippingStatus } from '../../types';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | ''>('');
  const [selectedShippingStatus, setSelectedShippingStatus] = useState<ShippingStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminOrdersFilterParams = {
        page: currentPage,
        limit: 15,
        search: search.trim() || undefined,
        status: selectedStatus || undefined,
        paymentStatus: selectedPaymentStatus || undefined,
        shippingStatus: selectedShippingStatus || undefined,
      };
      const res = await adminService.getOrders(params);
      setOrders(res.orders);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || 'Unable to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedStatus, selectedPaymentStatus, selectedShippingStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedStatus('');
    setSelectedPaymentStatus('');
    setSelectedShippingStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedStatus || selectedPaymentStatus || selectedShippingStatus
  );

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase">
            OPERATIONS
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-0.5">
            Orders Management
          </h1>
          <p className="text-xs text-[#68756E]">
            {pagination.total} total orders recorded across the pantry platform
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white hover:bg-[#F7F1E5] border border-[#E8DECB] text-[#123B2A] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs w-fit disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DECB] shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, Customer Name, Email, or Phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Order Status Select */}
            <div className="flex-1 sm:w-40">
              <select
                aria-label="Filter by Order Status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Fulfillment</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Select */}
            <div className="flex-1 sm:w-36">
              <select
                aria-label="Filter by Payment Status"
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] cursor-pointer"
              >
                <option value="">All Payments</option>
                <option value="CAPTURED">Captured</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Submit / Filter Buttons */}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Filter</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-[#E8DECB] hover:bg-[#F7F1E5] text-[#68756E] text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="underline font-bold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-14 bg-[#F7F1E5] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center mx-auto border border-[#E8DECB]">
              <ShoppingBag className="w-6 h-6 text-[#C6A15B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#092218]">No Orders Found</h3>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No orders match the selected search criteria or status filters.'
                : 'There are currently no customer orders placed in the system.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors mt-2"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DECB]/60">
                {orders.map((order) => {
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
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#1C1C1C] block truncate max-w-[160px]">
                          {order.user?.name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-[#68756E] block truncate max-w-[160px]">
                          {order.user?.email || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#68756E] whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 text-[#1C1C1C] font-semibold">
                        {order._count?.items || 1} {order._count?.items === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#123B2A]">
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8DECB] hover:bg-[#123B2A] hover:text-white text-[#123B2A] text-xs font-bold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#FCFAF5] border-t border-[#E8DECB] flex items-center justify-between text-xs">
            <span className="text-[#68756E]">
              Showing page <span className="font-bold text-[#1C1C1C]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#1C1C1C]">{pagination.totalPages}</span> ({pagination.total} orders)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="p-2 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] hover:bg-[#F7F1E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                aria-label="Next page"
                className="p-2 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] hover:bg-[#F7F1E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

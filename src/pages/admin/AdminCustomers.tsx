// src/pages/admin/AdminCustomers.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Users,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { ApiError } from '../../services/api';
import type {
  AdminCustomerListItem,
  AdminPagination,
  AdminCustomersFilterParams,
} from '../../types/admin';

function resolveCustomerErrorMessage(err: unknown): string {
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

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controlled search input vs committed server query to prevent duplicate API calls
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminCustomersFilterParams = {
        page: currentPage,
        limit: 15,
        search: committedSearch || undefined,
      };
      const res = await adminService.getCustomers(params);
      setCustomers(res.customers);
      setPagination({
        ...res.pagination,
        totalPages: Math.max(1, res.pagination.totalPages || 1),
      });
    } catch (err: unknown) {
      setError(resolveCustomerErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, committedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed === committedSearch && currentPage === 1) {
      return;
    }
    setCommittedSearch(trimmed);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (committedSearch !== '' || currentPage !== 1) {
      setCommittedSearch('');
      setCurrentPage(1);
    }
  };

  const hasActiveSearch = Boolean(committedSearch);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#C6A15B] uppercase block">
            CUSTOMER INSIGHTS
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-0.5">
            Customer Directory
          </h1>
          <p className="text-xs text-[#68756E] mt-0.5">
            {pagination.total} registered {pagination.total === 1 ? 'customer' : 'customers'} with server-authoritative order &amp; spend history
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          disabled={loading}
          aria-label="Refresh customer list"
          className="inline-flex items-center gap-2 bg-white hover:bg-[#F7F1E5] border border-[#E8DECB] text-[#123B2A] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs w-fit disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DECB] shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3" role="search">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search customers by name, email, or phone"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customers by full name, email address, or phone number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A] focus:bg-white focus:ring-1 focus:ring-[#123B2A] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
            >
              <Search className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
              <span>Search</span>
            </button>

            {(hasActiveSearch || searchInput.trim() !== '') && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-xl border border-[#E8DECB] hover:bg-[#F7F1E5] text-[#68756E] hover:text-[#1C1C1C] text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#123B2A]"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear Search</span>
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
            onClick={fetchCustomers}
            className="underline font-bold hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-600 rounded px-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-2xs overflow-hidden">
        {loading ? (
          <div aria-busy="true" aria-label="Loading customers">
            {/* Desktop Table Skeleton */}
            <div className="hidden md:block p-6 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-[#F7F1E5] rounded-xl animate-pulse"
                />
              ))}
            </div>
            {/* Mobile Card Skeletons */}
            <div className="md:hidden p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[#E8DECB] space-y-3 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-4 bg-[#F7F1E5] rounded w-36" />
                    <div className="h-4 bg-[#F7F1E5] rounded w-16" />
                  </div>
                  <div className="h-3 bg-[#F7F1E5] rounded w-48" />
                  <div className="h-8 bg-[#F7F1E5] rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : customers.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center mx-auto border border-[#E8DECB]">
              <Users className="w-6 h-6 text-[#C6A15B]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#092218]">
              No customers found
            </h2>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto">
              {hasActiveSearch
                ? 'Try adjusting your search.'
                : 'No customer accounts have been registered on the platform yet.'}
            </p>
            {hasActiveSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors mt-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F1E5] text-[#123B2A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DECB]">
                  <tr>
                    <th scope="col" className="py-3.5 px-6">Customer</th>
                    <th scope="col" className="py-3.5 px-4">Email</th>
                    <th scope="col" className="py-3.5 px-4">Phone</th>
                    <th scope="col" className="py-3.5 px-4">Orders</th>
                    <th scope="col" className="py-3.5 px-4">Lifetime Spend</th>
                    <th scope="col" className="py-3.5 px-4">Joined</th>
                    <th scope="col" className="py-3.5 px-4">Role</th>
                    <th scope="col" className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DECB]/60">
                  {customers.map((customer) => {
                    const displayName = customer.name?.trim() || 'Registered Customer';
                    const initials = displayName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={customer.id} className="hover:bg-[#FCFAF5] transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full bg-[#123B2A] text-[#C6A15B] font-serif font-bold text-xs flex items-center justify-center shrink-0"
                              aria-hidden="true"
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/customers/${customer.id}`}
                                className="font-bold text-[#092218] hover:text-[#C6A15B] transition-colors block truncate max-w-[180px] focus:outline-none focus:underline"
                              >
                                {displayName}
                              </Link>
                              {customer.isVerified && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                  <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#1C1C1C] font-medium">
                          <span className="block truncate max-w-[220px]">{customer.email}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#68756E] whitespace-nowrap">
                          {customer.phone || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-[#123B2A] bg-[#F7F1E5] px-2.5 py-1 rounded-md border border-[#E8DECB]">
                            <ShoppingBag className="w-3 h-3 text-[#C6A15B]" aria-hidden="true" />
                            {customer.orderCount ?? customer._count?.orders ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#123B2A] whitespace-nowrap">
                          {formatCurrency(customer.lifetimeSpend)}
                        </td>
                        <td className="py-3.5 px-4 text-[#68756E] whitespace-nowrap">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border tracking-wider bg-[#F7F1E5] text-[#123B2A] border-[#C6A15B]/50">
                            {customer.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <Link
                            to={`/admin/customers/${customer.id}`}
                            aria-label={`View profile for ${displayName}`}
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

            {/* Mobile Responsive Cards View */}
            <div className="md:hidden divide-y divide-[#E8DECB]">
              {customers.map((customer) => {
                const displayName = customer.name?.trim() || 'Registered Customer';
                const orderCount = customer.orderCount ?? customer._count?.orders ?? 0;

                return (
                  <div key={customer.id} className="p-4 space-y-3 hover:bg-[#FCFAF5] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="font-serif font-bold text-base text-[#092218] hover:text-[#C6A15B] block truncate"
                        >
                          {displayName}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-[#68756E] mt-0.5 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0 text-[#C6A15B]" aria-hidden="true" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[#68756E] mt-0.5">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-[#C6A15B]" aria-hidden="true" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>

                      <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider bg-[#F7F1E5] text-[#123B2A] border-[#C6A15B]/50 shrink-0">
                        {customer.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FCFAF5] border border-[#E8DECB]/80 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-[#68756E] block font-bold">
                          Orders
                        </span>
                        <span className="font-extrabold text-[#123B2A]">
                          {orderCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#68756E] block font-bold">
                          Lifetime Spend
                        </span>
                        <span className="font-extrabold text-[#123B2A]">
                          {formatCurrency(customer.lifetimeSpend)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#68756E] block font-bold">
                          Joined
                        </span>
                        <span className="font-semibold text-[#1C1C1C] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#C6A15B] shrink-0" aria-hidden="true" />
                          {formatDate(customer.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        aria-label={`View profile for ${displayName}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-4 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C6A15B]" aria-hidden="true" />
                        <span>View Customer Profile</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bounded Pagination Footer */}
        {!loading && customers.length > 0 && (
          <div className="p-4 bg-[#FCFAF5] border-t border-[#E8DECB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#68756E]">
              Showing page <span className="font-bold text-[#1C1C1C]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#1C1C1C]">{pagination.totalPages}</span> ({pagination.total}{' '}
              {pagination.total === 1 ? 'customer' : 'customers'})
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

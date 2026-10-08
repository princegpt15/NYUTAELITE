// src/pages/admin/AdminNotifications.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Info,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type {
  AdminNotification,
  AdminNotificationChannel,
  AdminNotificationStatus,
  AdminNotificationType,
  AdminNotificationsResponse,
} from '../../types/admin';

const NOTIFICATION_TYPES: { value: AdminNotificationType; label: string }[] = [
  { value: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
  { value: 'ORDER_PROCESSING', label: 'Order Processing' },
  { value: 'ORDER_SHIPPED', label: 'Order Shipped' },
  { value: 'ORDER_DELIVERED', label: 'Order Delivered' },
  { value: 'ORDER_CANCELLED', label: 'Order Cancelled' },
  { value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
  { value: 'PAYMENT_FAILED', label: 'Payment Failed' },
  { value: 'REFUND_INITIATED', label: 'Refund Initiated' },
  { value: 'REFUND_COMPLETED', label: 'Refund Completed' },
];

function getStatusBadge(status: AdminNotificationStatus) {
  switch (status) {
    case 'SENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          SENT
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" />
          FAILED
        </span>
      );
    case 'SENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          SENDING
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          PENDING
        </span>
      );
  }
}

function getChannelBadge(channel: AdminNotificationChannel) {
  if (channel === 'WHATSAPP') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-800 border border-green-200">
        <MessageSquare className="w-3.5 h-3.5" />
        WHATSAPP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#FCFAF5] text-[#123B2A] border border-[#E8DECB]">
      <Mail className="w-3.5 h-3.5 text-[#C6A15B]" />
      EMAIL
    </span>
  );
}

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [summary, setSummary] = useState<AdminNotificationsResponse['summary']>({
    totalNotifications: 0,
    sentCount: 0,
    failedCount: 0,
    pendingCount: 0,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminNotificationStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<AdminNotificationChannel | ''>('');
  const [typeFilter, setTypeFilter] = useState<AdminNotificationType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail modal
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getNotifications({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        type: typeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setNotifications(response.notifications);
      setSummary(response.summary);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notification records.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, channelFilter, typeFilter, startDate, endDate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setChannelFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#C6A15B] uppercase block">
            COMMUNICATION AUDIT LOG
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#123B2A]">
            Customer Notifications
          </h1>
          <p className="text-sm text-[#68756E] mt-1">
            Monitor Email and WhatsApp order/payment lifecycle notifications, delivery status, and retry telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchNotifications}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8DECB] text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:border-[#C6A15B] transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
              Total Dispatched
            </span>
            <Bell className="w-4 h-4 text-[#C6A15B]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#123B2A] mt-2">
            {summary.totalNotifications.toLocaleString()}
          </p>
          <span className="text-xs text-[#68756E] mt-1 block">
            All recorded lifecycle events
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
              Delivered / Sent
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-2">
            {summary.sentCount.toLocaleString()}
          </p>
          <span className="text-xs text-[#68756E] mt-1 block">
            Accepted by notification provider
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
              Pending / Sending
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-2">
            {summary.pendingCount.toLocaleString()}
          </p>
          <span className="text-xs text-[#68756E] mt-1 block">
            In queue or retrying
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E]">
              Failed
            </span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-serif font-bold text-red-700 mt-2">
            {summary.failedCount.toLocaleString()}
          </p>
          <span className="text-xs text-[#68756E] mt-1 block">
            Exhausted retries or rejected
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8DECB] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient, order ID, subject, provider message ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-sm text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as AdminNotificationStatus | '');
              setPage(1);
            }}
            aria-label="Filter by status"
            className="px-3.5 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-sm text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
          >
            <option value="">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="PENDING">Pending</option>
            <option value="SENDING">Sending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value as AdminNotificationChannel | '');
              setPage(1);
            }}
            aria-label="Filter by channel"
            className="px-3.5 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-sm text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
          >
            <option value="">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as AdminNotificationType | '');
              setPage(1);
            }}
            aria-label="Filter by event type"
            className="px-3.5 py-2.5 rounded-xl border border-[#E8DECB] bg-[#FCFAF5] text-sm text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
          >
            <option value="">All Event Types</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8DECB]/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
                From:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#68756E]">
                To:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] text-xs text-[#1C1C1C]"
              />
            </div>
          </div>

          {(search || statusFilter || channelFilter || typeFilter || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold uppercase tracking-wider text-[#123B2A] hover:text-[#C6A15B] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FCFAF5] border-b border-[#E8DECB] text-[11px] font-extrabold uppercase tracking-wider text-[#68756E]">
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4 text-center">Attempts</th>
                <th className="py-3.5 px-4">Sent At</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DECB]/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#68756E]">
                    Loading customer notifications...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#68756E]">
                    No notifications match your current filters.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-[#FCFAF5]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#68756E]">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#123B2A]">
                        {n.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getChannelBadge(n.channel)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-[#1C1C1C] truncate max-w-[180px]">
                        {n.recipient}
                      </div>
                      {n.user?.name && (
                        <div className="text-[11px] text-[#68756E] truncate max-w-[180px]">
                          {n.user.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {n.orderId ? (
                        <Link
                          to={`/admin/orders/${n.orderId}`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#123B2A] hover:text-[#C6A15B] transition-colors"
                        >
                          #{n.orderId.slice(0, 8).toUpperCase()}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-[#68756E]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(n.status)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-[#68756E]">
                      {n.provider || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono text-xs font-bold text-[#1C1C1C]">
                      {n.attemptCount}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#68756E]">
                      {n.sentAt
                        ? new Date(n.sentAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedNotification(n)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8DECB] bg-[#FCFAF5] hover:border-[#123B2A] text-xs font-bold text-[#123B2A] transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3.5 bg-[#FCFAF5] border-t border-[#E8DECB] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#68756E]">
            Showing page <strong className="text-[#123B2A]">{page}</strong> of{' '}
            <strong className="text-[#123B2A]">{totalPages}</strong> ({total} total records)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] disabled:opacity-40 hover:border-[#C6A15B] transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-lg border border-[#E8DECB] bg-white text-[#123B2A] disabled:opacity-40 hover:border-[#C6A15B] transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Inspection Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E8DECB] shadow-xl max-w-xl w-full overflow-hidden">
            <div className="p-5 bg-[#123B2A] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#C6A15B] uppercase block">
                  NOTIFICATION TELEMETRY
                </span>
                <h2 className="font-serif text-lg font-bold text-[#FCFAF5]">
                  {selectedNotification.type} ({selectedNotification.channel})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-lg text-[#E8DECB] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                    Status
                  </span>
                  <div className="mt-1">{getStatusBadge(selectedNotification.status)}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                    Channel
                  </span>
                  <div className="mt-1">{getChannelBadge(selectedNotification.channel)}</div>
                </div>
              </div>

              <div className="border-t border-[#E8DECB] pt-3 space-y-2.5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                    Subject
                  </span>
                  <p className="font-semibold text-[#1C1C1C]">
                    {selectedNotification.subject || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                      Recipient
                    </span>
                    <p className="font-mono text-xs text-[#1C1C1C] break-all">
                      {selectedNotification.recipient}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                      Provider & Message ID
                    </span>
                    <p className="font-mono text-xs text-[#1C1C1C] break-all">
                      {selectedNotification.provider || '—'}{' '}
                      {selectedNotification.providerMessageId
                        ? `(${selectedNotification.providerMessageId})`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                      Idempotency Key
                    </span>
                    <p className="font-mono text-xs text-[#68756E] break-all">
                      {selectedNotification.idempotencyKey}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#68756E] block">
                      Attempts
                    </span>
                    <p className="font-mono text-xs font-bold text-[#1C1C1C]">
                      {selectedNotification.attemptCount} / 3
                    </p>
                  </div>
                </div>

                {selectedNotification.errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 block">
                      Last Error Message
                    </span>
                    <p className="font-mono text-xs text-red-700 mt-1 break-words">
                      {selectedNotification.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#FCFAF5] border-t border-[#E8DECB] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0d2b1e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

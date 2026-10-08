// src/pages/admin/AdminSystemHealth.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Database,
  Server,
  Zap,
  ShoppingBag,
  CreditCard,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminSystemHealthResponse } from '../../types/admin';

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remMinutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h ${remMinutes}m`;
}

export const AdminSystemHealth: React.FC = () => {
  const [data, setData] = useState<AdminSystemHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchHealth = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      setError(null);
      const res = await adminService.getSystemHealth();
      setData(res);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch operational health status');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth(true);
    }, 15000); // 15-second refresh interval
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const getStatusBadge = (status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'healthy' | 'warning' | 'critical') => {
    const s = status?.toUpperCase();
    if (s === 'HEALTHY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    if (s === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Warning</span>
        </span>
      );
    }
    if (s === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>Critical</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
        <span>Unknown</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C6A15B]">
              OPERATIONAL OBSERVABILITY
            </span>
            {data && getStatusBadge(data.overallStatus)}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
            System Health & Telemetry
          </h1>
          <p className="text-xs text-[#68756E]">
            Real-time status of application runtime, database, API traffic, and order pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
              autoRefresh
                ? 'bg-[#123B2A] text-white border-[#123B2A]'
                : 'bg-white text-[#68756E] border-[#E8DECB] hover:bg-[#F7F1E5]'
            }`}
          >
            Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => fetchHealth(false)}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C6A15B] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {lastRefreshedAt && (
        <div className="flex items-center justify-between text-[11px] text-[#68756E] px-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last checked: <span className="font-semibold text-[#1C1C1C]">{lastRefreshedAt}</span>
          </span>
          <span>Environment: <strong className="uppercase">{data?.application.environment || 'production'}</strong></span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. APPLICATION RUNTIME */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#123B2A]/10 text-[#123B2A] flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#092218]">Application</h2>
            </div>
            {getStatusBadge(data?.application.status)}
          </div>

          <div className="space-y-2.5 pt-2 text-xs border-t border-[#F2ECE1]">
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Service</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">{data?.application.service || 'nyuta-elite-api'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Process Uptime</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">
                {data ? formatUptime(data.application.uptimeSeconds) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Node Runtime</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">{data?.application.nodeVersion || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Memory (RSS)</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">
                {data?.application.memoryUsageMb ? `${data.application.memoryUsageMb.rss} MB` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Heap Used</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">
                {data?.application.memoryUsageMb ? `${data.application.memoryUsageMb.heapUsed} MB / ${data.application.memoryUsageMb.heapTotal} MB` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. POSTGRESQL DATABASE */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#092218]">Database</h2>
            </div>
            {getStatusBadge(data?.database.status)}
          </div>

          <div className="space-y-2.5 pt-2 text-xs border-t border-[#F2ECE1]">
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Provider Engine</span>
              <span className="font-semibold text-[#1C1C1C] uppercase">{data?.database.provider || 'PostgreSQL'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Query Latency (SELECT 1)</span>
              <span className="font-mono font-bold text-emerald-700">
                {data?.database.latencyMs !== null ? `${data?.database.latencyMs} ms` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Connection Pool</span>
              <span className="font-semibold text-emerald-700">Active Singleton</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Last Verified</span>
              <span className="text-[11px] text-[#68756E]">
                {data?.database.lastCheckedAt ? new Date(data.database.lastCheckedAt).toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. API PERFORMANCE & TRAFFIC */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#092218]">API Traffic</h2>
            </div>
            {getStatusBadge(data?.api.status)}
          </div>

          <div className="space-y-2.5 pt-2 text-xs border-t border-[#F2ECE1]">
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Total Processed</span>
              <span className="font-mono font-bold text-[#1C1C1C]">{data?.api.totalRequests ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">HTTP 5xx Server Errors</span>
              <span className={`font-mono font-bold ${(data?.api.serverErrorCount || 0) > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {data?.api.serverErrorCount ?? 0} ({data?.api.errorRatePercent ?? 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Slow Requests (&gt; 1s)</span>
              <span className={`font-mono font-semibold ${(data?.api.slowRequestsCount || 0) > 0 ? 'text-amber-600' : 'text-[#68756E]'}`}>
                {data?.api.slowRequestsCount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Latency p50 / p95</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">
                {data?.api.p50LatencyMs !== null ? `${data?.api.p50LatencyMs}ms` : '—'} / {data?.api.p95LatencyMs !== null ? `${data?.api.p95LatencyMs}ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. ORDERS PIPELINE */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#092218]">Orders</h2>
            </div>
            <span className="text-xs font-bold text-[#123B2A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {data?.orders.total ?? 0} Total
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-[#F2ECE1]">
            <div className="p-2 rounded-lg bg-[#FCFAF5]">
              <span className="block text-[10px] uppercase font-bold text-[#68756E]">Pending</span>
              <span className="font-mono font-bold text-[#1C1C1C] text-sm">{data?.orders.pending ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#FCFAF5]">
              <span className="block text-[10px] uppercase font-bold text-[#68756E]">Confirmed</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">{data?.orders.confirmed ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#FCFAF5]">
              <span className="block text-[10px] uppercase font-bold text-[#68756E]">Processing</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{data?.orders.processing ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#FCFAF5]">
              <span className="block text-[10px] uppercase font-bold text-[#68756E]">Shipped</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{data?.orders.shipped ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#FCFAF5]">
              <span className="block text-[10px] uppercase font-bold text-[#68756E]">Delivered</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">{data?.orders.delivered ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#FCFAF5]">
              <span className="block text-[10px] uppercase font-bold text-[#68756E]">Cancelled</span>
              <span className="font-mono font-bold text-zinc-500 text-sm">{data?.orders.cancelled ?? 0}</span>
            </div>
          </div>
        </div>

        {/* 5. PAYMENTS & GATEWAY */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#092218]">Payments</h2>
            </div>
            <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
              {data?.payments.gateway.provider || 'Razorpay'}
            </span>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[#F2ECE1]">
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Captured (Paid)</span>
              <span className="font-mono font-bold text-emerald-700">{data?.payments.captured ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Pending Checkout</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">{data?.payments.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Refunded</span>
              <span className="font-mono font-semibold text-amber-700">{data?.payments.refunded ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Failed Payments</span>
              <span className="font-mono font-semibold text-red-600">{data?.payments.failed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE1]">
              <span className="text-[#68756E]">Webhooks Processed</span>
              <span className="font-mono font-semibold text-[#1C1C1C]">{data?.payments.gateway.webhooksProcessed ?? 0}</span>
            </div>
          </div>
        </div>

        {/* 6. NOTIFICATION PIPELINE */}
        <div className="bg-white rounded-2xl border border-[#E8DECB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-800 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-lg font-bold text-[#092218]">Notifications</h2>
            </div>
            {getStatusBadge(data?.notifications.status)}
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[#F2ECE1]">
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Sent Successfully</span>
              <span className="font-mono font-bold text-emerald-700">{data?.notifications.sent ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Retrying / In-Flight</span>
              <span className="font-mono font-semibold text-amber-600">{data?.notifications.retrying ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Permanently Failed</span>
              <span className="font-mono font-semibold text-red-600">
                {data?.notifications.failed ?? 0} ({data?.notifications.failureRatePercent ?? 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Active Email Provider</span>
              <span className="font-semibold text-[#1C1C1C] uppercase">{data?.notifications.providers.email || 'mock'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#68756E]">Active WhatsApp Provider</span>
              <span className="font-semibold text-[#1C1C1C] uppercase">{data?.notifications.providers.whatsapp || 'disabled'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Error Banner if Present */}
      {data?.api.lastError && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-amber-800 block">
                Last Recorded API Error
              </span>
              <p className="font-medium text-[#1C1C1C]">
                {data.api.lastError.message}
                {data.api.lastError.code && <span className="ml-2 font-mono text-[11px] text-zinc-500">[{data.api.lastError.code}]</span>}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-[#68756E] pt-1">
                <span>Timestamp: {new Date(data.api.lastError.timestamp).toLocaleTimeString()}</span>
                {data.api.lastError.requestId && (
                  <span>Request ID: <span className="font-mono text-[#1C1C1C]">{data.api.lastError.requestId}</span></span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

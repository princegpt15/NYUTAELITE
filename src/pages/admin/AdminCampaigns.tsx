// src/pages/admin/AdminCampaigns.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Megaphone,
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Play,
  XCircle,
  TrendingUp,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { growthApi, type Campaign, type CustomerSegment, type CampaignAnalytics } from '../../services/growth';

export default function AdminCampaigns() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments' | 'carts'>('campaigns');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignAnalytics | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Campaign Form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'EMAIL' as 'EMAIL' | 'WHATSAPP',
    audience: 'all_customers',
    subject: '',
    content: '',
    couponCode: '',
    maxRecipients: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'campaigns') {
        const res = await growthApi.getCampaigns({ search, status: statusFilter });
        setCampaigns(res.campaigns || []);
      } else if (activeTab === 'segments') {
        const segs = await growthApi.getSegments();
        setSegments(segs);
      } else if (activeTab === 'carts') {
        const cartsRes = await growthApi.getAbandonedCarts();
        setAbandonedCarts(cartsRes.carts || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load growth data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load segments once for campaign dropdown
  useEffect(() => {
    growthApi.getSegments().then(setSegments).catch(() => {});
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await growthApi.createCampaign({
        name: formData.name,
        description: formData.description,
        channel: formData.channel,
        audience: formData.audience,
        subject: formData.subject,
        content: formData.content,
        couponCode: formData.couponCode || undefined,
        maxRecipients: formData.maxRecipients ? Number(formData.maxRecipients) : undefined,
      });
      setShowCreateModal(false);
      setSuccessMsg('Campaign created successfully in DRAFT mode.');
      setFormData({
        name: '',
        description: '',
        channel: 'EMAIL',
        audience: 'all_customers',
        subject: '',
        content: '',
        couponCode: '',
        maxRecipients: '',
      });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreview = async (id: string) => {
    setActionLoading(true);
    try {
      const prev = await growthApi.previewCampaign(id);
      setPreviewData(prev);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load preview');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLaunch = async (id: string) => {
    if (!window.confirm('Are you sure you want to launch this campaign? This will snapshot the audience and initiate delivery.')) {
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await growthApi.launchCampaign(id);
      setSuccessMsg('Campaign launched successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to launch campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this campaign?')) return;
    setActionLoading(true);
    try {
      await growthApi.cancelCampaign(id);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setActionLoading(true);
    try {
      const detail = await growthApi.getCampaignDetail(id);
      setSelectedCampaign(detail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load campaign analytics');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunCartRecovery = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await growthApi.processAbandonedCarts({ maxLimit: 20 });
      setSuccessMsg(`Cart recovery sweep complete: ${res.sent} sent, ${res.skipped} skipped, ${res.failed} failed.`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to run cart recovery');
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalAttributedRevenue = campaigns.reduce((sum, c) => sum + c.attributedRevenue, 0);
  const totalAttributedOrders = campaigns.reduce((sum, c) => sum + c.attributedOrdersCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Growth & Marketing Automation</h1>
          <p className="text-sm text-stone-600 mt-1">Customer segmentation, personalized campaigns, and automated cart recovery</p>
        </div>
        {activeTab === 'campaigns' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Active Campaigns</span>
            <Megaphone className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">
            {campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'SCHEDULED').length}
          </div>
          <span className="text-xs text-stone-500 mt-1 block">Total: {campaigns.length} campaigns</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Messages Sent</span>
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">{totalSent}</div>
          <span className="text-xs text-stone-500 mt-1 block">Across all channels</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Attributed Orders</span>
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">{totalAttributedOrders}</div>
          <span className="text-xs text-stone-500 mt-1 block">Verified captured orders</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Attributed Revenue</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">₹{totalAttributedRevenue.toLocaleString('en-IN')}</div>
          <span className="text-xs text-stone-500 mt-1 block">Excludes failed/cancelled orders</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition ${
              activeTab === 'campaigns'
                ? 'border-amber-700 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Marketing Campaigns
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition ${
              activeTab === 'segments'
                ? 'border-amber-700 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Customer Segments
          </button>
          <button
            onClick={() => setActiveTab('carts')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition ${
              activeTab === 'carts'
                ? 'border-amber-700 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            Abandoned Cart Recovery
          </button>
        </nav>
      </div>

      {/* TAB 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-stone-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={fetchData}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm hover:bg-stone-50 transition"
            >
              <RefreshCw className="w-4 h-4 text-stone-600" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Campaign</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Deliveries</th>
                    <th className="py-3 px-4">Attributed Revenue</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">Loading campaigns...</td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">No campaigns found.</td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-900">{c.name}</div>
                          {c.couponCode && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                              <Tag className="w-3 h-3" />
                              {c.couponCode}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              c.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'ACTIVE'
                                ? 'bg-blue-100 text-blue-800'
                                : c.status === 'DRAFT'
                                ? 'bg-stone-100 text-stone-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                            {c.channel === 'EMAIL' ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            {c.channel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">{c.audience}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-stone-900 font-medium">
                            {c.sentCount} sent / {c.totalRecipients || 0} total
                          </div>
                          {c.failedCount > 0 && <div className="text-[11px] text-red-600">{c.failedCount} failed</div>}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-stone-900">
                          ₹{c.attributedRevenue.toLocaleString('en-IN')}
                          <div className="text-[11px] font-normal text-stone-500">({c.attributedOrdersCount} orders)</div>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleViewDetail(c.id)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                            title="Analytics & Recipients"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => handlePreview(c.id)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                                title="Preview Template"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleLaunch(c.id)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition"
                                title="Launch Campaign"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {c.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleCancel(c.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                              title="Cancel Campaign"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Customer Segments */}
      {activeTab === 'segments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div key={seg.key} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-900">{seg.name}</h3>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-900 font-bold text-xs rounded-full border border-amber-200">
                    {seg.count}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{seg.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
                <span>Key: {seg.key}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Abandoned Carts */}
      {activeTab === 'carts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200">
            <div>
              <h3 className="font-medium text-stone-900">Detected Inactive Carts</h3>
              <p className="text-xs text-stone-500">Carts inactive for 24+ hours with no completed order</p>
            </div>
            <button
              onClick={handleRunCartRecovery}
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Run Recovery Sweep'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Recovery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {abandonedCarts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">No eligible abandoned carts detected.</td>
                  </tr>
                ) : (
                  abandonedCarts.map((c) => (
                    <tr key={c.cartId} className="hover:bg-stone-50/60">
                      <td className="py-3.5 px-4 font-medium text-stone-900">{c.customerName || 'Guest / Unnamed'}</td>
                      <td className="py-3.5 px-4 text-stone-600">{c.customerEmail}</td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">{c.itemCount} items</td>
                      <td className="py-3.5 px-4 text-xs text-stone-500">{new Date(c.lastUpdated).toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700">
                          {c.recoveries?.[0]?.status || 'ELIGIBLE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-900">New Marketing Campaign</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 mt-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Super Makhana Offer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">Audience Segment</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  {segments.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name} ({s.count} customers)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special treat for {{customerName}}!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase">Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write message... Use {{customerName}}, {{couponCode}}, {{ctaUrl}}"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase">Max Recipients Limit</label>
                  <input
                    type="number"
                    placeholder="Leave empty for all"
                    value={formData.maxRecipients}
                    onChange={(e) => setFormData({ ...formData, maxRecipients: e.target.value })}
                    className="w-full mt-1 p-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-900">Campaign Preview</h3>
              <button onClick={() => setPreviewData(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase">Subject:</span>
                <div className="font-semibold text-stone-900">{previewData.previewSubject}</div>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 font-sans text-stone-800 whitespace-pre-wrap">
                {previewData.previewContent}
              </div>
              {previewData.couponCode && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  Attached Promo Code: <span className="font-bold">{previewData.couponCode}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg text-sm font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL & ANALYTICS MODAL */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">{selectedCampaign.campaign.name}</h3>
                <span className="text-xs text-stone-500">Audience: {selectedCampaign.campaign.audience}</span>
              </div>
              <button onClick={() => setSelectedCampaign(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>

            <div className="grid grid-cols-4 gap-3 my-4">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-center">
                <span className="text-xs text-stone-500 uppercase">Recipients</span>
                <div className="text-lg font-bold text-stone-900">{selectedCampaign.recipients.total}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                <span className="text-xs text-emerald-700 uppercase">Sent</span>
                <div className="text-lg font-bold text-emerald-800">{selectedCampaign.recipients.sent}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                <span className="text-xs text-blue-700 uppercase">Attributed Orders</span>
                <div className="text-lg font-bold text-blue-800">{selectedCampaign.attribution.attributedOrdersCount}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-center">
                <span className="text-xs text-amber-700 uppercase">Revenue</span>
                <div className="text-lg font-bold text-amber-800">₹{selectedCampaign.attribution.attributedRevenue}</div>
              </div>
            </div>

            <h4 className="font-semibold text-stone-900 text-sm mt-6 mb-2">Attributed Order Ledger</h4>
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Order Number</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {selectedCampaign.attribution.orders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-stone-400">No attributed orders recorded yet.</td>
                    </tr>
                  ) : (
                    selectedCampaign.attribution.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2 px-3 font-mono">{o.orderNumber}</td>
                        <td className="py-2 px-3 font-semibold">₹{o.totalAmount}</td>
                        <td className="py-2 px-3 text-stone-500">{new Date(o.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

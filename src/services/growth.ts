// src/services/growth.ts
import { api } from './api';

export interface CustomerSegment {
  key: string;
  name: string;
  description: string;
  count: number;
}

export interface CustomerGrowthProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  lifecycleState: string;
  orderCount: number;
  totalSpend: number;
  lastOrderDate: string | null;
  loyaltyBalance: number;
  wishlistItemsCount: number;
  reviewsCount: number;
  marketingEmailOptIn: boolean;
  marketingWhatsAppOptIn: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  channel: 'EMAIL' | 'WHATSAPP';
  audience: string;
  subject: string;
  content: string;
  couponCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxRecipients?: number | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  attributedOrdersCount: number;
  attributedRevenue: number;
  utmCampaign?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    status: string;
    channel: string;
    audience: string;
    couponCode: string | null;
    createdAt: string;
  };
  recipients: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  attribution: {
    attributedOrdersCount: number;
    attributedRevenue: number;
    orders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      createdAt: string;
    }>;
  };
}

export interface CustomerPreferences {
  marketingEmailOptIn: boolean;
  marketingWhatsAppOptIn: boolean;
  unsubscribedAt?: string | null;
}

export const growthApi = {
  // Admin Segments & Customers
  getSegments: async (): Promise<CustomerSegment[]> => {
    const res = await api.get<{ success: boolean; data: { segments: CustomerSegment[] } }>('/admin/growth/segments');
    return res.data?.segments || [];
  },

  getCustomers: async (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params).toString();
    const res = await api.get<{
      success: boolean;
      data: {
        items: CustomerGrowthProfile[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>(`/admin/growth/customers?${qs}`);
    return res.data;
  },

  getCustomerDetail: async (id: string) => {
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/customers/${id}`);
    return res.data;
  },

  // Admin Campaigns
  getCampaigns: async (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params).toString();
    const res = await api.get<{
      success: boolean;
      data: {
        campaigns: Campaign[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>(`/admin/growth/campaigns?${qs}`);
    return res.data;
  },

  getCampaignDetail: async (id: string): Promise<CampaignAnalytics> => {
    const res = await api.get<{ success: boolean; data: CampaignAnalytics }>(`/admin/growth/campaigns/${id}`);
    return res.data;
  },

  createCampaign: async (payload: {
    name: string;
    description?: string;
    channel?: 'EMAIL' | 'WHATSAPP';
    audience: string;
    subject: string;
    content: string;
    couponCode?: string;
    maxRecipients?: number;
  }) => {
    const res = await api.post<{ success: boolean; data: { campaign: Campaign } }>('/admin/growth/campaigns', payload);
    return res.data.campaign;
  },

  updateCampaign: async (id: string, payload: Partial<Campaign>) => {
    const res = await api.patch<{ success: boolean; data: { campaign: Campaign } }>(`/admin/growth/campaigns/${id}`, payload);
    return res.data.campaign;
  },

  previewCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; data: { preview: any } }>(`/admin/growth/campaigns/${id}/preview`, {});
    return res.data.preview;
  },

  launchCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; data: { campaign: Campaign } }>(`/admin/growth/campaigns/${id}/launch`, {});
    return res.data.campaign;
  },

  cancelCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; data: { campaign: Campaign } }>(`/admin/growth/campaigns/${id}/cancel`, {});
    return res.data.campaign;
  },

  getCampaignRecipients: async (id: string, page = 1) => {
    const res = await api.get<{ success: boolean; data: { recipients: any[]; pagination: any } }>(
      `/admin/growth/campaigns/${id}/recipients?page=${page}`
    );
    return res.data;
  },

  // Admin Abandoned Carts
  getAbandonedCarts: async (thresholdHours?: number) => {
    const qs = thresholdHours ? `?thresholdHours=${thresholdHours}` : '';
    const res = await api.get<{ success: boolean; data: { count: number; carts: any[] } }>(
      `/admin/growth/abandoned-carts${qs}`
    );
    return res.data;
  },

  processAbandonedCarts: async (payload?: { maxLimit?: number; thresholdHours?: number }) => {
    const res = await api.post<{ success: boolean; data: any }>('/admin/growth/abandoned-carts/process', payload || {});
    return res.data;
  },

  // Customer Preferences & Unsubscribe
  getCustomerPreferences: async (): Promise<CustomerPreferences> => {
    const res = await api.get<{ success: boolean; data: { preferences: CustomerPreferences } }>(
      '/account/preferences'
    );
    return res.data.preferences;
  },

  updateCustomerPreferences: async (payload: {
    marketingEmailOptIn?: boolean;
    marketingWhatsAppOptIn?: boolean;
  }): Promise<CustomerPreferences> => {
    const res = await api.put<{ success: boolean; data: { preferences: CustomerPreferences } }>(
      '/account/preferences',
      payload
    );
    return res.data.preferences;
  },

  unsubscribe: async (token: string, channel?: 'EMAIL' | 'WHATSAPP') => {
    const res = await api.post<{ success: boolean; data: { success: boolean; message: string } }>(
      '/marketing/unsubscribe',
      { token, channel }
    );
    return res.data;
  },

  restoreRecoveredCart: async (token: string) => {
    const res = await api.get<{ success: boolean; data: any }>(`/cart/recover/${token}`);
    return res.data;
  },

  // ================= PHASE 19: GROWTH ANALYTICS =================
  getGrowthAnalyticsDashboard: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/dashboard${qs}`);
    return res.data;
  },

  getConversionFunnel: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/funnel/conversion${qs}`);
    return res.data;
  },

  getCheckoutFunnel: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/funnel/checkout${qs}`);
    return res.data;
  },

  getProductConversionAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/products${qs}`);
    return res.data;
  },

  getCartRecoveryAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/cart-recovery${qs}`);
    return res.data;
  },

  getCampaignPerformanceAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/campaigns${qs}`);
    return res.data;
  },

  getSegmentPerformanceAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/segments${qs}`);
    return res.data;
  },

  getCohortRetentionAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/cohorts${qs}`);
    return res.data;
  },

  getRepeatAndLtvAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/repeat-ltv${qs}`);
    return res.data;
  },

  getProgramsPerformanceAnalytics: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await api.get<{ success: boolean; data: any }>(`/admin/growth/analytics/programs${qs}`);
    return res.data;
  },

  trackBehavioralEvent: async (payload: {
    eventName: string;
    visitorId?: string;
    productId?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  }) => {
    const res = await api.post<{ success: boolean; data: any }>('/analytics/events', payload);
    return res.data;
  },

  // ================= PHASE 19: EXPERIMENTATION ENGINE =================
  listExperiments: async (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await api.get<{ success: boolean; data: { experiments: any[] } }>(`/admin/experiments${qs}`);
    return res.data?.experiments || [];
  },

  createExperiment: async (payload: {
    key: string;
    name: string;
    description?: string;
    primaryMetric: string;
    secondaryMetrics?: string[];
    trafficPercentage?: number;
    minSampleSize?: number;
    startAt?: string | null;
    endAt?: string | null;
    variants: Array<{
      key: string;
      name: string;
      description?: string;
      allocationPercentage: number;
      isControl?: boolean;
      config?: Record<string, any>;
    }>;
  }) => {
    const res = await api.post<{ success: boolean; data: { experiment: any } }>('/admin/experiments', payload);
    return res.data.experiment;
  },

  getExperimentDetail: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { experiment: any } }>(`/admin/experiments/${id}`);
    return res.data.experiment;
  },

  updateExperiment: async (id: string, payload: Record<string, any>) => {
    const res = await api.patch<{ success: boolean; data: { experiment: any } }>(`/admin/experiments/${id}`, payload);
    return res.data.experiment;
  },

  transitionExperimentStatus: async (
    id: string,
    status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  ) => {
    const res = await api.post<{ success: boolean; data: { experiment: any } }>(
      `/admin/experiments/${id}/status`,
      { status }
    );
    return res.data.experiment;
  },

  getExperimentResults: async (id: string) => {
    const res = await api.get<{ success: boolean; data: any }>(`/admin/experiments/${id}/results`);
    return res.data;
  },

  assignExperiment: async (experimentKey: string, visitorId?: string) => {
    const res = await api.post<{ success: boolean; data: any }>(
      `/experiments/${encodeURIComponent(experimentKey)}/assign`,
      { visitorId }
    );
    return res.data;
  },

  recordExperimentEvent: async (
    experimentKey: string,
    payload: {
      eventName: string;
      visitorId?: string;
      orderId?: string;
      idempotencyKey?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    const res = await api.post<{ success: boolean; data: any }>(
      `/experiments/${encodeURIComponent(experimentKey)}/events`,
      payload
    );
    return res.data;
  },
};


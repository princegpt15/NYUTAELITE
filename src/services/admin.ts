// src/services/admin.ts
import { api } from './api';
import type {
  AdminDashboardStats,
  AdminOrdersResponse,
  AdminOrderDetail,
  AdminOrdersFilterParams,
  AdminUpdateOrderStatusPayload,
  AdminRefundOrderPayload,
  AdminRefundOrderResult,
  AdminProductsResponse,
  AdminProductsFilterParams,
  AdminProduct,
  AdminCreateProductPayload,
  AdminUpdateProductPayload,
  AdminCustomersResponse,
  AdminCustomersFilterParams,
  AdminCustomerDetail,
  AdminPaymentsResponse,
  AdminPaymentsFilterParams,
  AdminPaymentDetail,
  AdminCouponsResponse,
  AdminCouponsFilterParams,
  AdminCoupon,
  AdminCouponDetail,
  AdminCreateCouponPayload,
  AdminUpdateCouponPayload,
  AdminNotification,
  AdminNotificationsResponse,
  AdminNotificationsFilterParams,
  AnalyticsDateRangeParams,
  AnalyticsSummaryResponse,
  AnalyticsRevenueResponse,
  AnalyticsOrdersResponse,
  AnalyticsPaymentsResponse,
  AnalyticsRefundsResponse,
  AnalyticsProductsResponse,
  AnalyticsCustomersResponse,
  AnalyticsCouponsResponse,
  AdminSystemHealthResponse,
} from '../types/admin';

export const adminService = {
  /**
   * Fetch operational dashboard KPI metrics and recent orders.
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const res = await api.get<{ success: boolean; data: AdminDashboardStats }>('/admin/dashboard');
    return (res as any)?.data ?? res;
  },

  /**
   * List orders with server-side filters and bounded pagination.
   */
  async getOrders(params: AdminOrdersFilterParams = {}): Promise<AdminOrdersResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.shippingStatus) query.set('shippingStatus', params.shippingStatus);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/orders?${queryString}` : '/admin/orders';
    const res = await api.get<{ success: boolean; data: any[]; pagination: any }>(endpoint);

    const data = (res as any)?.data ?? [];
    const pagination = (res as any)?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 20,
      total: data.length,
      totalPages: 1,
    };

    return {
      orders: data,
      pagination,
    };
  },

  /**
   * Get full order details for administrative inspection.
   */
  async getOrderById(id: string): Promise<AdminOrderDetail> {
    const res = await api.get<{ success: boolean; data: AdminOrderDetail }>(`/admin/orders/${id}`);
    return (res as any)?.data ?? res;
  },

  /**
   * Update order fulfillment status and/or shipping status.
   */
  async updateOrderStatus(
    id: string,
    payload: AdminUpdateOrderStatusPayload
  ): Promise<{
    id: string;
    orderNumber: string;
    status: string;
    shippingStatus: string;
    paymentStatus: string;
    updatedAt: string;
  }> {
    const res = await api.patch<{ success: boolean; data: any }>(`/admin/orders/${id}/status`, payload);
    return (res as any)?.data ?? res;
  },

  /**
   * Initiate a server-authoritative Razorpay refund for an eligible order.
   */
  async refundOrder(
    id: string,
    payload: AdminRefundOrderPayload = {}
  ): Promise<AdminRefundOrderResult> {
    const res = await api.post<{ success: boolean; message: string; data: AdminRefundOrderResult }>(
      `/admin/orders/${id}/refund`,
      payload
    );
    return (res as any)?.data ?? res;
  },

  /**
   * List products with server-side filters, search, and pagination.
   */
  async getProducts(params: AdminProductsFilterParams = {}): Promise<AdminProductsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params.lowStock !== undefined) query.set('lowStock', String(params.lowStock));

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/products?${queryString}` : '/admin/products';
    const res = await api.get<{ success: boolean; data: any[]; pagination: any }>(endpoint);

    const data = (res as any)?.data ?? [];
    const pagination = (res as any)?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 20,
      total: data.length,
      totalPages: 1,
    };

    return {
      products: data,
      pagination,
    };
  },

  /**
   * Create a new product.
   */
  async createProduct(payload: AdminCreateProductPayload): Promise<AdminProduct> {
    const res = await api.post<{ success: boolean; data: AdminProduct }>('/admin/products', payload);
    return (res as any)?.data ?? res;
  },

  /**
   * Update an existing product (attributes, pricing, stock, active status).
   */
  async updateProduct(id: string, payload: AdminUpdateProductPayload): Promise<AdminProduct> {
    const res = await api.patch<{ success: boolean; data: AdminProduct }>(`/admin/products/${id}`, payload);
    return (res as any)?.data ?? res;
  },

  /**
   * List customers with server-side search and bounded pagination (Read-Only).
   */
  async getCustomers(params: AdminCustomersFilterParams = {}): Promise<AdminCustomersResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(Math.min(100, Math.max(1, params.limit))));
    if (params.search) query.set('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/customers?${queryString}` : '/admin/customers';
    const res = await api.get<{ success: boolean; data: any[]; pagination: any }>(endpoint);

    const data = (res as any)?.data ?? [];
    const pagination = (res as any)?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 20,
      total: data.length,
      totalPages: 1,
    };

    return {
      customers: data,
      pagination,
    };
  },

  /**
   * Get single customer profile, addresses, lifetime spend, and recent order history (Read-Only).
   */
  async getCustomerById(id: string): Promise<AdminCustomerDetail> {
    const res = await api.get<{ success: boolean; data: AdminCustomerDetail }>(`/admin/customers/${id}`);
    return (res as any)?.data ?? res;
  },

  /**
   * List payment transactions with server-side search, filters, and bounded pagination (Read-Only).
   */
  async getPayments(params: AdminPaymentsFilterParams = {}): Promise<AdminPaymentsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(Math.min(100, Math.max(1, params.limit))));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.orderStatus) query.set('orderStatus', params.orderStatus);

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/payments?${queryString}` : '/admin/payments';
    const res = await api.get<{ success: boolean; data: any[]; pagination: any }>(endpoint);

    const data = (res as any)?.data ?? [];
    const pagination = (res as any)?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 20,
      total: data.length,
      totalPages: 1,
    };

    return {
      payments: data,
      pagination,
    };
  },

  /**
   * Get single payment transaction record by ID (Read-Only).
   */
  async getPaymentById(id: string): Promise<AdminPaymentDetail> {
    const res = await api.get<{ success: boolean; data: AdminPaymentDetail }>(`/admin/payments/${id}`);
    return (res as any)?.data ?? res;
  },

  /**
   * List coupons with server-side filters, search, and pagination.
   */
  async getCoupons(params: AdminCouponsFilterParams = {}): Promise<AdminCouponsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params.discountType) query.set('discountType', params.discountType);
    if (params.validity && params.validity !== 'ALL') query.set('validity', params.validity);

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/coupons?${queryString}` : '/admin/coupons';
    const res = await api.get<{
      success: boolean;
      data: AdminCoupon[];
      summary?: any;
      pagination?: any;
    }>(endpoint);

    const data = (res as any)?.data ?? [];
    const summary = (res as any)?.summary ?? {
      totalCoupons: data.length,
      totalOrdersUsingCoupons: 0,
      totalDiscountGiven: 0,
    };
    const pagination = (res as any)?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 15,
      total: data.length,
      totalPages: 1,
    };

    return {
      coupons: data,
      summary,
      pagination,
    };
  },

  /**
   * Get single coupon details and usage statistics.
   */
  async getCouponById(id: string): Promise<AdminCouponDetail> {
    const res = await api.get<{ success: boolean; data: AdminCouponDetail }>(`/admin/coupons/${id}`);
    return (res as any)?.data ?? res;
  },

  /**
   * Create a new coupon.
   */
  async createCoupon(payload: AdminCreateCouponPayload): Promise<AdminCoupon> {
    const res = await api.post<{ success: boolean; data: AdminCoupon }>('/admin/coupons', payload);
    return (res as any)?.data ?? res;
  },

  /**
   * Update an existing coupon.
   */
  async updateCoupon(id: string, payload: AdminUpdateCouponPayload): Promise<AdminCoupon> {
    const res = await api.patch<{ success: boolean; data: AdminCoupon }>(`/admin/coupons/${id}`, payload);
    return (res as any)?.data ?? res;
  },

  /**
   * List customer notifications with server-side filters, search, and pagination (Read-Only).
   */
  async getNotifications(params: AdminNotificationsFilterParams = {}): Promise<AdminNotificationsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(Math.min(100, Math.max(1, params.limit))));
    if (params.status) query.set('status', params.status);
    if (params.channel) query.set('channel', params.channel);
    if (params.type) query.set('type', params.type);
    if (params.orderId) query.set('orderId', params.orderId);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const queryString = query.toString();
    const endpoint = queryString ? `/admin/notifications?${queryString}` : '/admin/notifications';
    const res = await api.get<{
      success: boolean;
      data: AdminNotification[];
      summary?: any;
      pagination?: any;
    }>(endpoint);

    const data = (res as any)?.data ?? [];
    const summary = (res as any)?.summary ?? {
      totalNotifications: data.length,
      sentCount: 0,
      failedCount: 0,
      pendingCount: 0,
    };
    const pagination = (res as any)?.pagination ?? {
      page: params.page || 1,
      limit: params.limit || 20,
      total: data.length,
      totalPages: 1,
    };

    return {
      notifications: data,
      summary,
      pagination,
    };
  },

  /**
   * Get single notification record by ID (Read-Only).
   */
  async getNotificationById(id: string): Promise<AdminNotification> {
    const res = await api.get<{ success: boolean; data: AdminNotification }>(`/admin/notifications/${id}`);
    return (res as any)?.data ?? res;
  },

  /**
   * Build URL query string for Analytics endpoints.
   */
  _buildAnalyticsQuery(params: Record<string, any> = {}): string {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, String(v));
      }
    }
    return query.toString();
  },

  async getAnalyticsSummary(params: AnalyticsDateRangeParams = {}): Promise<AnalyticsSummaryResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsSummaryResponse }>(
      qs ? `/admin/analytics/summary?${qs}` : '/admin/analytics/summary'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsRevenue(params: AnalyticsDateRangeParams = {}): Promise<AnalyticsRevenueResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsRevenueResponse }>(
      qs ? `/admin/analytics/revenue?${qs}` : '/admin/analytics/revenue'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsOrders(params: AnalyticsDateRangeParams = {}): Promise<AnalyticsOrdersResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsOrdersResponse }>(
      qs ? `/admin/analytics/orders?${qs}` : '/admin/analytics/orders'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsPayments(params: AnalyticsDateRangeParams = {}): Promise<AnalyticsPaymentsResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsPaymentsResponse }>(
      qs ? `/admin/analytics/payments?${qs}` : '/admin/analytics/payments'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsRefunds(params: AnalyticsDateRangeParams = {}): Promise<AnalyticsRefundsResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsRefundsResponse }>(
      qs ? `/admin/analytics/refunds?${qs}` : '/admin/analytics/refunds'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsProducts(
    params: AnalyticsDateRangeParams & {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      sortBy?: 'revenue' | 'unitsSold' | 'orders' | 'stock';
      sortOrder?: 'asc' | 'desc';
      performance?: 'all' | 'top' | 'low';
    } = {}
  ): Promise<AnalyticsProductsResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsProductsResponse }>(
      qs ? `/admin/analytics/products?${qs}` : '/admin/analytics/products'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsCustomers(
    params: AnalyticsDateRangeParams & {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ): Promise<AnalyticsCustomersResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsCustomersResponse }>(
      qs ? `/admin/analytics/customers?${qs}` : '/admin/analytics/customers'
    );
    return (res as any)?.data ?? res;
  },

  async getAnalyticsCoupons(
    params: AnalyticsDateRangeParams & {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ): Promise<AnalyticsCouponsResponse> {
    const qs = this._buildAnalyticsQuery(params);
    const res = await api.get<{ success: boolean; data: AnalyticsCouponsResponse }>(
      qs ? `/admin/analytics/coupons?${qs}` : '/admin/analytics/coupons'
    );
    return (res as any)?.data ?? res;
  },

  /**
   * Fetch comprehensive system health and operational metrics.
   */
  async getSystemHealth(): Promise<AdminSystemHealthResponse> {
    const res = await api.get<AdminSystemHealthResponse>('/admin/system-health');
    return res;
  },
};


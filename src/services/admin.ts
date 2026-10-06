// src/services/admin.ts
import { api } from './api';
import type {
  AdminDashboardStats,
  AdminOrdersResponse,
  AdminOrderDetail,
  AdminOrdersFilterParams,
  AdminUpdateOrderStatusPayload,
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
};

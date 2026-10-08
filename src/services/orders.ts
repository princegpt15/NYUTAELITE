// src/services/orders.ts
import { api, ApiError } from './api';
import type { Order, CreateOrderPayload, Address, CouponValidationResult } from '../types';

export const orderService = {
  /** Validate a coupon code against the authenticated user's live database cart */
  async validateCoupon(couponCode: string): Promise<CouponValidationResult> {
    try {
      const resp = await api.post<{
        success: boolean;
        message?: string;
        data: CouponValidationResult;
      }>('/coupons/validate', { couponCode });
      return (resp as any).data ?? resp;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Unable to validate coupon. Please try again.', 500);
    }
  },

  /** Create a new order on backend from the authenticated user's cart */
  async createOrder(payload: CreateOrderPayload | any): Promise<Order> {
    try {
      let normalizedPayload = { ...payload };
      if (payload.address) {
        const addr = payload.address;
        normalizedPayload.address = {
          fullName: addr.fullName || addr.name || '',
          phone: addr.phone || '',
          addressLine1: addr.addressLine1 || addr.street || '',
          addressLine2: addr.addressLine2 || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || addr.pincode || addr.zip || '',
          country: addr.country || 'India',
          landmark: addr.landmark || '',
          isDefault: addr.isDefault ?? false,
        };
      }
      const resp = await api.post<{ success: boolean; message?: string; data: Order }>(
        '/orders',
        normalizedPayload
      );
      return (resp as any).data ?? resp;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Failed to create order', 500);
    }
  },

  /** Fetch all orders for the current user */
  async getOrders(): Promise<Order[]> {
    try {
      const resp = await api.get<{ success: boolean; data: Order[] }>('/orders');
      return (resp as any).data ?? resp ?? [];
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Failed to fetch orders', 500);
    }
  },

  /** Fetch a specific order by its ID */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const resp = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
      return (resp as any).data ?? resp;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Failed to fetch order details', 500);
    }
  },

  /** Cancel an order if allowed */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const resp = await api.post<{ success: boolean; data: Order }>(`/orders/${orderId}/cancel`, {});
      return (resp as any).data ?? resp;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Failed to cancel order', 500);
    }
  },

  /** Fetch saved addresses for the current user */
  async getAddresses(): Promise<Address[]> {
    try {
      const resp = await api.get<{ success: boolean; data: Address[] }>('/addresses');
      return (resp as any).data ?? resp ?? [];
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Failed to fetch addresses', 500);
    }
  },

  /** Save a new address */
  async createAddress(address: Address | any): Promise<Address> {
    try {
      const normalizedAddress = {
        fullName: address.fullName || address.name || '',
        phone: address.phone || '',
        addressLine1: address.addressLine1 || address.street || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || address.pincode || address.zip || '',
        country: address.country || 'India',
        landmark: address.landmark || '',
        isDefault: address.isDefault ?? false,
      };
      const resp = await api.post<{ success: boolean; data: Address }>('/addresses', normalizedAddress);
      return (resp as any).data ?? resp;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(err?.message || 'Failed to save address', 500);
    }
  },

  /** Authoritatively claim GA4 purchase analytics eligibility on backend PostgreSQL ledger */
  async claimPurchaseAnalytics(orderIdOrNumber: string): Promise<{
    eligible: boolean;
    alreadyRecorded: boolean;
    idempotencyKey: string | null;
    reason?: string;
    payload?: {
      transactionId: string;
      orderId: string;
      currency: string;
      value: number;
      tax: number;
      shipping: number;
      discount: number;
      couponCode: string | null;
      items: any[];
    };
  }> {
    const resp = await api.post<any>(
      `/orders/${encodeURIComponent(orderIdOrNumber)}/analytics/purchase`,
      {}
    );
    return (resp as any)?.data ?? resp;
  },

  /** Authoritatively claim GA4 refund analytics eligibility on backend PostgreSQL ledger */
  async claimRefundAnalytics(
    orderIdOrNumber: string,
    refundId?: string | null
  ): Promise<{
    eligible: boolean;
    alreadyRecorded: boolean;
    idempotencyKey: string | null;
    refundId: string | null;
    reason?: string;
    payload?: {
      transactionId: string;
      orderId: string;
      refundId: string;
      currency: string;
      value: number;
      couponCode: string | null;
      items: any[];
    };
  }> {
    const resp = await api.post<any>(
      `/orders/${encodeURIComponent(orderIdOrNumber)}/analytics/refund`,
      refundId ? { refundId } : {}
    );
    return (resp as any)?.data ?? resp;
  },
};

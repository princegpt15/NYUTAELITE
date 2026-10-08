// src/services/retention.ts
/**
 * Frontend Retention & Customer Loyalty API Service
 * Manages Wishlist, Reorder, Reviews, Back-in-Stock, Loyalty, Referrals, and Recommendations.
 */

import { api } from './api';

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    weight: string | null;
    stock: number;
    isActive: boolean;
  };
}

export interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user?: {
    name: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface LoyaltyAccountInfo {
  userId: string;
  availableBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  pointValueInr: number;
  maxRedemptionPercent: number;
}

export interface LoyaltyTransactionItem {
  id: string;
  type: 'EARN_ORDER' | 'REDEEM_ORDER' | 'REFUND_REVERSAL' | 'MANUAL_ADJUSTMENT' | 'BONUS';
  points: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string;
  createdAt: string;
}

export interface ReferralInfo {
  referralCode: string;
  shareUrl: string;
  rewardPointsPerReferral: number;
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  referrals: Array<{
    id: string;
    referredUserName: string;
    status: 'PENDING' | 'QUALIFIED' | 'CANCELLED';
    rewardPoints: number;
    createdAt: string;
  }>;
}

export interface AccountSummary {
  profile: {
    name: string;
    email: string;
    phone: string | null;
    memberSince: string;
  };
  retention: {
    wishlistCount: number;
    loyaltyBalance: number;
    lifetimePointsEarned: number;
    referralCode: string;
    totalReferrals: number;
  };
  orders: {
    total: number;
    active: number;
    recent: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      status: string;
      paymentStatus: string;
      shippingStatus: string;
      createdAt: string;
    }>;
  };
}

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  weight: string | null;
  rating?: number;
  reviewsCount?: number;
}

export const retentionService = {
  // ================= WISHLIST =================
  async getWishlist(): Promise<WishlistItem[]> {
    const res = await api.get<{ success: boolean; data: WishlistItem[] }>('/wishlist');
    return res.data || [];
  },

  async getWishlistCount(): Promise<number> {
    const res = await api.get<{ success: boolean; data: { count: number } }>('/wishlist/count');
    return res.data?.count || 0;
  },

  async addToWishlist(productId: string): Promise<WishlistItem> {
    const res = await api.post<{ success: boolean; data: WishlistItem }>('/wishlist', { productId });
    return res.data;
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await api.delete<{ success: boolean }>(`/wishlist/${productId}`);
  },

  async moveToCart(productId: string): Promise<{ message: string; cartItem: any }> {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      `/wishlist/${productId}/move-to-cart`,
      {}
    );
    return { message: res.message, cartItem: res.data };
  },

  async moveFromCartToWishlist(productId: string): Promise<{ message: string; wishlistItem: any }> {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      `/cart/items/${productId}/move-to-wishlist`,
      {}
    );
    return { message: res.message, wishlistItem: res.data };
  },

  // ================= REORDER =================
  async reorder(orderId: string): Promise<{
    addedItems: Array<{ productId: string; name: string; quantity: number; price: number }>;
    unavailableItems: Array<{ productId: string; name: string; reason: string }>;
    totalAdded: number;
  }> {
    const res = await api.post<{
      success: boolean;
      data: {
        addedItems: Array<{ productId: string; name: string; quantity: number; price: number }>;
        unavailableItems: Array<{ productId: string; name: string; reason: string }>;
        totalAdded: number;
      };
    }>(`/orders/${orderId}/reorder`, {});
    return res.data;
  },

  // ================= REVIEWS =================
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<{
    reviews: ReviewItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await api.get<{
      success: boolean;
      data: {
        reviews: ReviewItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getProductRatingSummary(productId: string): Promise<RatingSummary> {
    const res = await api.get<{ success: boolean; data: RatingSummary }>(
      `/products/${productId}/rating-summary`
    );
    return res.data;
  },

  async createReview(data: {
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<ReviewItem> {
    const res = await api.post<{ success: boolean; message: string; data: ReviewItem }>(
      '/reviews',
      data
    );
    return res.data;
  },

  async getMyReviews(): Promise<ReviewItem[]> {
    const res = await api.get<{ success: boolean; data: ReviewItem[] }>('/reviews/me');
    return res.data || [];
  },

  async updateMyReview(
    id: string,
    data: { rating?: number; title?: string; comment?: string }
  ): Promise<ReviewItem> {
    const res = await api.put<{ success: boolean; data: ReviewItem }>(`/reviews/${id}`, data);
    return res.data;
  },

  async deleteMyReview(id: string): Promise<void> {
    await api.delete<{ success: boolean }>(`/reviews/${id}`);
  },

  // Admin Reviews
  async adminGetReviews(params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    page?: number;
    limit?: number;
  }): Promise<{
    reviews: ReviewItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await api.get<{
      success: boolean;
      data: {
        reviews: ReviewItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`/admin/reviews?${q.toString()}`);
    return res.data;
  },

  async adminModerateReview(id: string, status: 'APPROVED' | 'REJECTED'): Promise<ReviewItem> {
    const res = await api.put<{ success: boolean; data: ReviewItem }>(
      `/admin/reviews/${id}/status`,
      { status }
    );
    return res.data;
  },

  async adminDeleteReview(id: string): Promise<void> {
    await api.delete<{ success: boolean }>(`/admin/reviews/${id}`);
  },

  // ================= BACK-IN-STOCK =================
  async subscribeBackInStock(productId: string): Promise<{ subscribed: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      `/products/${productId}/back-in-stock`,
      {}
    );
    return { subscribed: true, message: res.message };
  },

  async unsubscribeBackInStock(productId: string): Promise<{ unsubscribed: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/products/${productId}/back-in-stock`
    );
    return { unsubscribed: true, message: res.message };
  },

  async getBackInStockStatus(productId: string): Promise<{ subscribed: boolean; inStock: boolean }> {
    const res = await api.get<{ success: boolean; data: { subscribed: boolean; inStock: boolean } }>(
      `/products/${productId}/back-in-stock/status`
    );
    return res.data;
  },

  async getMyBackInStock(): Promise<Array<{ id: string; productId: string; product: any }>> {
    const res = await api.get<{ success: boolean; data: any[] }>('/back-in-stock/me');
    return res.data || [];
  },

  // ================= LOYALTY =================
  async getLoyaltyAccount(): Promise<LoyaltyAccountInfo> {
    const res = await api.get<{ success: boolean; data: LoyaltyAccountInfo }>('/loyalty/account');
    return res.data;
  },

  async getLoyaltyTransactions(page = 1, limit = 10): Promise<{
    transactions: LoyaltyTransactionItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await api.get<{
      success: boolean;
      data: {
        transactions: LoyaltyTransactionItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`/loyalty/transactions?page=${page}&limit=${limit}`);
    return res.data;
  },

  async calculateLoyaltyRedemption(
    subtotal: number,
    requestedPoints?: number
  ): Promise<{
    availableBalance: number;
    maxRedemptionPoints: number;
    pointsToRedeem: number;
    discountInr: number;
    netSubtotal: number;
  }> {
    const res = await api.post<{
      success: boolean;
      data: {
        availableBalance: number;
        maxRedemptionPoints: number;
        pointsToRedeem: number;
        discountInr: number;
        netSubtotal: number;
      };
    }>('/loyalty/calculate-redemption', { subtotal, requestedPoints });
    return res.data;
  },

  // ================= REFERRAL =================
  async getReferralInfo(): Promise<ReferralInfo> {
    const res = await api.get<{ success: boolean; data: ReferralInfo }>('/referral/info');
    return res.data;
  },

  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>('/referral/apply', { code });
    return res;
  },

  // ================= RECOMMENDATIONS =================
  async getRecommendations(params?: {
    productId?: string;
    limit?: number;
  }): Promise<RecommendedProduct[]> {
    const q = new URLSearchParams();
    if (params?.productId) q.set('productId', params.productId);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await api.get<{ success: boolean; data: RecommendedProduct[] }>(
      `/products/recommendations?${q.toString()}`
    );
    return res.data || [];
  },

  // ================= ACCOUNT & RETENTION SUMMARY =================
  async getAccountSummary(): Promise<AccountSummary> {
    const res = await api.get<{ success: boolean; data: AccountSummary }>('/account/summary');
    return res.data;
  },

  async adminGetRetentionSummary(): Promise<{
    reviews: { total: number; pending: number; approved: number; rejected: number };
    loyalty: { totalAccounts: number; totalEarned: number; totalRedeemed: number };
    referrals: { total: number; qualified: number; pending: number };
    backInStock: { pendingNotifications: number };
    wishlists: { totalItems: number };
  }> {
    const res = await api.get<{ success: boolean; data: any }>('/admin/retention/summary');
    return res.data;
  },
};

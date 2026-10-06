// src/types/admin.ts
import type { OrderStatus, PaymentStatus, ShippingStatus, Address } from './index';

export interface AdminRecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

export interface AdminOrdersByStatus {
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface AdminPaymentsByStatus {
  pending: number;
  authorized: number;
  captured: number;
  failed: number;
  refunded: number;
}

export interface AdminInventorySummary {
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts?: number;
}

export interface AdminCustomerSummary {
  total: number;
  newLast30Days?: number;
}

export interface AdminDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  revenueRule: string;
  ordersByStatus: AdminOrdersByStatus;
  paymentsByStatus?: AdminPaymentsByStatus;
  customers: AdminCustomerSummary;
  inventory: AdminInventorySummary;
  recentOrders: AdminRecentOrder[];
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingAmount: number | null;
  discountAmount: number | null;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  _count: {
    items: number;
  };
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminOrdersResponse {
  orders: AdminOrderListItem[];
  pagination: AdminPagination;
}

export interface AdminOrderItemDetail {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    images: any;
    weight: number | null;
    category: string | null;
  } | null;
}

export interface AdminPaymentSafeMetadata {
  id: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  signatureVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: number;
  shippingAmount: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  razorpayOrderId: string | null;
  shippingAddress: Address | any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
  } | null;
  items: AdminOrderItemDetail[];
  payments: AdminPaymentSafeMetadata[];
}

export interface AdminOrdersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
  from?: string;
  to?: string;
}

export interface AdminUpdateOrderStatusPayload {
  orderStatus?: OrderStatus;
  shippingStatus?: ShippingStatus;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  images: any;
  ingredients: any;
  weight: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orderItems: number;
  };
}

export interface AdminProductsResponse {
  products: AdminProduct[];
  pagination: AdminPagination;
}

export interface AdminProductsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface AdminCreateProductPayload {
  name: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sku: string;
  images?: any;
  ingredients?: any;
  weight?: number | null;
  isActive?: boolean;
}

export interface AdminUpdateProductPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  sku?: string;
  images?: any;
  ingredients?: any;
  weight?: number | null;
  isActive?: boolean;
}

export interface AdminCustomerListItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  lifetimeSpend: number;
  _count?: {
    orders: number;
  };
}

export interface AdminCustomersResponse {
  customers: AdminCustomerListItem[];
  pagination: AdminPagination;
}

export interface AdminCustomersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminCustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string | null;
  isDefault: boolean;
}

export interface AdminCustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  totalAmount: number;
  currency?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  lifetimeSpend: number;
  addresses: AdminCustomerAddress[];
  orders: AdminCustomerOrderHistoryItem[];
  _count: {
    orders: number;
    reviews: number;
  };
}

export interface AdminPaymentListItem {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  signatureVerified: boolean;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt?: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
      phone?: string | null;
    } | null;
  } | null;
}

export interface AdminPaymentsResponse {
  payments: AdminPaymentListItem[];
  pagination: AdminPagination;
}

export interface AdminPaymentsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  orderStatus?: OrderStatus;
}

export interface AdminPaymentDetail {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  signatureVerified: boolean;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    currency?: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    shippingStatus: ShippingStatus;
    createdAt?: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
    } | null;
  } | null;
}

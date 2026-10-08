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
  couponCode?: string | null;
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

export interface AdminRefundSummary {
  isEligible: boolean;
  capturedAmount: number;
  previouslyRefundedAmount: number;
  remainingRefundableAmount: number;
  refundStatus: 'NONE' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  latestRefund?: {
    id: string;
    refundReference: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
  } | null;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: number;
  shippingAmount: number | null;
  discountAmount: number | null;
  couponCode?: string | null;
  couponMeta?: {
    couponId: string;
    couponCode: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    discountAmount: number;
    appliedAt: string;
  } | null;
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
  refundSummary?: AdminRefundSummary;
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

export interface AdminRefundOrderPayload {
  amount?: number;
  reason?: string;
}

export interface AdminRefundOrderResult {
  refundId: string;
  paymentRecordId: string;
  orderId: string;
  orderNumber: string;
  originalPaymentReference: string | null;
  capturedAmount: number;
  refundAmount: number;
  previouslyRefundedAmount: number;
  remainingRefundableAmount: number;
  currency: string;
  status: 'REFUNDED' | 'PARTIALLY_REFUNDED';
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
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
  refundSummary?: {
    isRefundTransaction: boolean;
    totalRefundedAmount: number;
    refundStatus: 'NONE' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
    refundRecords: AdminPaymentSafeMetadata[];
  };
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    currency?: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    shippingStatus: ShippingStatus;
    createdAt?: string;
    payments?: AdminPaymentSafeMetadata[];
    user?: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
    } | null;
  } | null;
}

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED';
export type CouponEffectiveStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SCHEDULED' | 'LIMIT_REACHED';

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscount: number | null;
  maximumDiscountAmount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  usageCount: number;
  perCustomerLimit: number | null;
  isActive: boolean;
  isExpired: boolean;
  isScheduled: boolean;
  isLimitReached: boolean;
  effectiveStatus: CouponEffectiveStatus;
  createdAt: string | null;
  updatedAt: string | null;
  usageStats: {
    ordersCount: number;
    totalDiscountGiven: number;
    revenueBeforeDiscount: number;
    revenueAfterDiscount: number;
  };
}

export interface AdminCouponDetail extends AdminCoupon {
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    subtotal: number;
    discountAmount: number | null;
    shippingAmount: number | null;
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
}

export interface AdminCouponsResponse {
  coupons: AdminCoupon[];
  summary: {
    totalCoupons: number;
    totalOrdersUsingCoupons: number;
    totalDiscountGiven: number;
  };
  pagination: AdminPagination;
}

export interface AdminCouponsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  discountType?: CouponDiscountType;
  validity?: 'ALL' | 'VALID' | 'EXPIRED' | 'SCHEDULED';
}

export interface AdminCreateCouponPayload {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount?: number | null;
  maximumDiscount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  isActive?: boolean;
}

export interface AdminUpdateCouponPayload {
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minimumOrderAmount?: number | null;
  maximumDiscount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  isActive?: boolean;
}

export type AdminNotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED';

export type AdminNotificationChannel = 'EMAIL' | 'WHATSAPP';

export type AdminNotificationStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';

export interface AdminNotification {
  id: string;
  idempotencyKey: string;
  userId: string;
  orderId: string;
  type: AdminNotificationType;
  channel: AdminNotificationChannel;
  status: AdminNotificationStatus;
  recipient: string;
  subject: string | null;
  provider: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  order?: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    shippingStatus?: ShippingStatus;
    totalAmount: number;
    createdAt?: string;
  } | null;
}

export interface AdminNotificationsResponse {
  notifications: AdminNotification[];
  summary: {
    totalNotifications: number;
    sentCount: number;
    failedCount: number;
    pendingCount: number;
  };
  pagination: AdminPagination;
}

export interface AdminNotificationsFilterParams {
  page?: number;
  limit?: number;
  status?: AdminNotificationStatus;
  channel?: AdminNotificationChannel;
  type?: AdminNotificationType;
  orderId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export type AnalyticsRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'previous_month'
  | 'this_year'
  | 'custom';

export type AnalyticsGranularity = 'auto' | 'daily' | 'weekly' | 'monthly';

export interface AnalyticsDateRangeParams {
  range?: AnalyticsRangePreset;
  startDate?: string;
  endDate?: string;
  granularity?: AnalyticsGranularity;
}

export interface AnalyticsMeta {
  range: AnalyticsRangePreset;
  timezone: string;
  utcOffset: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  granularity: 'daily' | 'weekly' | 'monthly';
  currency?: string;
  moneyUnit?: string;
  definitions?: Record<string, string>;
}

export interface AnalyticsSummaryResponse {
  meta: AnalyticsMeta;
  kpis: {
    netRevenue: number;
    netRevenueRupees: number;
    netRevenuePaise: number;
    grossSales: number;
    grossSalesRupees: number;
    grossSalesPaise: number;
    totalOrders: number;
    qualifyingOrdersCount: number;
    averageOrderValue: number;
    averageOrderValueRupees: number;
    averageOrderValuePaise: number;
    refundedAmount: number;
    refundedAmountRupees: number;
    refundedAmountPaise: number;
    refundedOrdersCount: number;
    refundRatePercent: number;
    refundVolumeRatePercent: number;
    totalCustomers: number;
    activeBuyingCustomers: number;
    newCustomers: number;
    newRegisteredCustomers: number;
    returningCustomers: number;
    repeatPurchaseRatePercent: number;
    unitsSold: number;
    couponDiscountTotal: number;
    couponDiscountRupees: number;
    couponDiscountPaise: number;
    couponOrdersCount: number;
  };
  ordersByStatus: Record<OrderStatus, number>;
  inventory: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    totalStockUnits: number;
    estimatedStockValueRupees: number;
    estimatedStockValuePaise: number;
  };
  carts: {
    totalCarts: number;
    cartsWithItems: number;
    totalCartUnits: number;
    activeCartValueRupees: number;
    activeCartValuePaise: number;
    note: string;
  };
}

export interface AnalyticsRevenuePoint {
  date: string;
  grossSales: number;
  grossSalesRupees: number;
  grossSalesPaise: number;
  refunds: number;
  refundsRupees: number;
  refundsPaise: number;
  netRevenue: number;
  netRevenueRupees: number;
  netRevenuePaise: number;
  discountRupees: number;
  discountPaise: number;
  qualifyingOrdersCount: number;
  totalOrdersCount: number;
}

export interface AnalyticsRevenueResponse {
  meta: AnalyticsMeta;
  totals: {
    grossSales: number;
    grossSalesRupees: number;
    grossSalesPaise: number;
    refunds: number;
    refundsRupees: number;
    refundsPaise: number;
    netRevenue: number;
    netRevenueRupees: number;
    netRevenuePaise: number;
    discountRupees: number;
    discountPaise: number;
    qualifyingOrdersCount: number;
  };
  series: AnalyticsRevenuePoint[];
}

export interface AnalyticsOrdersResponse {
  meta: AnalyticsMeta;
  totals: {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  statusDistribution: Array<{
    status: OrderStatus;
    count: number;
    percentage: number;
  }>;
  shippingDistribution: Array<{
    shippingStatus: ShippingStatus;
    count: number;
    percentage: number;
  }>;
  trend: Array<{
    date: string;
    totalOrders: number;
    qualifyingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
  }>;
}

export interface AnalyticsPaymentsResponse {
  meta: AnalyticsMeta;
  totals: {
    totalTransactions: number;
    capturedCount: number;
    capturedAmountRupees: number;
    capturedAmountPaise: number;
    failedCount: number;
    failedAmountRupees: number;
    failedAmountPaise: number;
    pendingCount: number;
    pendingAmountRupees: number;
    pendingAmountPaise: number;
    authorizedCount: number;
    authorizedAmountRupees: number;
    authorizedAmountPaise: number;
    refundedCount: number;
    refundedAmountRupees: number;
    refundedAmountPaise: number;
    paymentSuccessRatePercent: number;
  };
  statusBreakdown: Array<{
    status: PaymentStatus;
    count: number;
    amountRupees: number;
    amountPaise: number;
    percentage: number;
  }>;
}

export interface AnalyticsRefundsResponse {
  meta: AnalyticsMeta & { refundRateDefinition?: string };
  totals: {
    totalRefunds: number;
    refundedOrdersCount: number;
    qualifyingOrdersCount: number;
    refundAmount: number;
    refundAmountRupees: number;
    refundAmountPaise: number;
    refundRatePercent: number;
    refundVolumeRatePercent: number;
  };
  trend: Array<{
    date: string;
    refundCount: number;
    refundAmount: number;
    refundAmountRupees: number;
    refundAmountPaise: number;
  }>;
  byReason: Array<{
    reason: string;
    count: number;
    amountRupees: number;
    amountPaise: number;
  }>;
  refundedOrders: Array<{
    orderId: string;
    orderNumber: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    orderTotalRupees: number;
    orderTotalPaise: number;
    refundedAmountRupees: number;
    refundedAmountPaise: number;
    refundStatus: 'PARTIALLY_REFUNDED' | 'REFUNDED';
    reason: string;
    refundedAt: string;
  }>;
}

export interface AnalyticsProductRow {
  productId: string;
  name: string;
  sku: string | null;
  category: string;
  isActive: boolean;
  stock: number;
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';
  unitsSold: number;
  ordersCount: number;
  grossRevenue: number;
  grossRevenueRupees: number;
  grossRevenuePaise: number;
  estimatedRefundedRupees: number;
  estimatedRefundedPaise: number;
  netRevenue: number;
  netRevenueRupees: number;
  netRevenuePaise: number;
  averageSellingPriceRupees: number;
  averageSellingPricePaise: number;
}

export interface AnalyticsProductsResponse {
  meta: AnalyticsMeta;
  topByRevenue: AnalyticsProductRow[];
  topByUnits: AnalyticsProductRow[];
  lowPerforming: AnalyticsProductRow[];
  categories: Array<{
    category: string;
    unitsSold: number;
    revenue: number;
    revenueRupees: number;
    revenuePaise: number;
    productsCount: number;
    percentageContribution: number;
  }>;
  products: AnalyticsProductRow[];
  pagination: AdminPagination;
}

export interface AnalyticsCustomerRow {
  customerId: string;
  name: string;
  email: string;
  ordersCount: number;
  periodOrdersCount: number;
  lifetimeSpend: number;
  lifetimeSpendRupees: number;
  lifetimeSpendPaise: number;
  netLifetimeSpendRupees: number;
  netLifetimeSpendPaise: number;
  periodSpendRupees: number;
  periodSpendPaise: number;
  firstOrderAt: string;
  lastOrderAt: string;
  customerType: 'NEW' | 'RETURNING';
}

export interface AnalyticsCustomersResponse {
  meta: AnalyticsMeta;
  totals: {
    totalCustomers: number;
    customersWithOrders: number;
    activeCustomersInPeriod: number;
    newRegisteredInPeriod: number;
    newCustomers: number;
    returningCustomers: number;
    repeatCustomersAllTime: number;
    repeatPurchaseRatePercent: number;
    lifetimeRepeatPurchaseRatePercent: number;
    averageCustomerSpend: number;
    averageCustomerSpendRupees: number;
    averageCustomerSpendPaise: number;
    averageOrdersPerCustomer: number;
  };
  topCustomers: AnalyticsCustomerRow[];
  pagination: AdminPagination;
}

export interface AnalyticsCouponRow {
  couponId: string | null;
  code: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  isExpired: boolean;
  usageLimit: number | null;
  totalUsedCount: number;
  ordersInPeriod: number;
  discountGiven: number;
  discountGivenRupees: number;
  discountGivenPaise: number;
  grossRevenueGenerated: number;
  grossRevenueGeneratedRupees: number;
  grossRevenueGeneratedPaise: number;
  netRevenueGenerated: number;
  netRevenueGeneratedRupees: number;
  netRevenueGeneratedPaise: number;
}

export interface AnalyticsCouponsResponse {
  meta: AnalyticsMeta;
  totals: {
    totalConfiguredCoupons: number;
    activeCouponsCount: number;
    inactiveOrExpiredCouponsCount: number;
    couponsUsedInPeriodCount: number;
    ordersUsingCouponsCount: number;
    couponOrderSharePercent: number;
    totalDiscountGiven: number;
    totalDiscountGivenRupees: number;
    totalDiscountGivenPaise: number;
    couponDrivenGrossSales: number;
    couponDrivenGrossSalesRupees: number;
    couponDrivenGrossSalesPaise: number;
    couponDrivenNetRevenue: number;
    couponDrivenNetRevenueRupees: number;
    couponDrivenNetRevenuePaise: number;
    averageDiscountPerCouponOrder: number;
    averageDiscountPerCouponOrderRupees: number;
    averageDiscountPerCouponOrderPaise: number;
  };
  coupons: AnalyticsCouponRow[];
  pagination: AdminPagination;
}

export interface AdminSystemHealthResponse {
  success: boolean;
  timestamp: string;
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  application: {
    service: string;
    environment: string;
    status: 'healthy';
    uptimeSeconds: number;
    nodeVersion: string;
    pid: number;
    memoryUsageMb: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    provider: 'postgresql';
    latencyMs: number | null;
    lastCheckedAt: string;
    connectionPool: string;
  };
  api: {
    status: 'healthy' | 'warning' | 'critical';
    totalRequests: number;
    statusCodes: Record<string, number>;
    serverErrorCount: number;
    errorRatePercent: number;
    slowRequestsCount: number;
    p50LatencyMs: number | null;
    p95LatencyMs: number | null;
    lastError: {
      timestamp: string;
      message: string;
      code?: string;
      requestId?: string;
    } | null;
  };
  orders: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    total: number;
  };
  payments: {
    pending: number;
    captured: number;
    failed: number;
    refunded: number;
    total: number;
    gateway: {
      provider: 'razorpay';
      webhooksProcessed: number;
      webhookFailures: number;
    };
  };
  notifications: {
    status: 'healthy' | 'warning' | 'critical';
    total: number;
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    retrying: number;
    failureRatePercent: number;
    lastFailure: {
      timestamp: string;
      recipientMasked: string;
      reason: string;
    } | null;
    providers: {
      email: string;
      whatsapp: string;
    };
  };
}


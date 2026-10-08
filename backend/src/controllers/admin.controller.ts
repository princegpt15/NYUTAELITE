// backend/src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { healthService } from '../services/health.service.js';

const adminService = new AdminService();

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDashboardStats();
    res.status(200).json({
      success: true,
      message: 'Admin dashboard statistics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, status, paymentStatus, shippingStatus, from, to } = req.query as any;
    const data = await adminService.getOrders({
      page,
      limit,
      search,
      status,
      paymentStatus,
      shippingStatus,
      from,
      to,
    });
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: data.orders,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.getOrderById(id);
    res.status(200).json({
      success: true,
      message: 'Order details retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { orderStatus, shippingStatus } = req.body;
    const data = await adminService.updateOrderStatus(id, { orderStatus, shippingStatus });
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, category, isActive, lowStock } = req.query as any;
    const data = await adminService.getProducts({
      page,
      limit,
      search,
      category,
      isActive,
      lowStock,
    });
    res.status(200).json({
      success: true,
      message: 'Admin products retrieved',
      data: data.products,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.updateProduct(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search } = req.query as any;
    const data = await adminService.getCustomers({ page, limit, search });
    res.status(200).json({
      success: true,
      message: 'Customers retrieved',
      data: data.customers,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.getCustomerById(id);
    res.status(200).json({
      success: true,
      message: 'Customer details retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, status, orderStatus } = req.query as any;
    const data = await adminService.getPayments({ page, limit, search, status, orderStatus });
    res.status(200).json({
      success: true,
      message: 'Payment records retrieved',
      data: data.payments,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.getPaymentById(id);
    res.status(200).json({
      success: true,
      message: 'Payment details retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const refundOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const adminUserId = (req as any).user?.id;
    const data = await adminService.refundOrder(id, { amount, reason, adminUserId });
    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, isActive, discountType, type, validity } = req.query as any;
    const data = await adminService.getCoupons({
      page,
      limit,
      search,
      isActive,
      discountType,
      type,
      validity,
    });
    res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: data.coupons,
      summary: data.summary,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getCouponById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.getCouponById(id);
    res.status(200).json({
      success: true,
      message: 'Coupon details retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.createCoupon(req.body);
    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.updateCoupon(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, channel, type, orderId, search, startDate, endDate } = req.query as any;
    const data = await adminService.getNotifications({
      page,
      limit,
      status,
      channel,
      type,
      orderId,
      search,
      startDate,
      endDate,
    });
    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: data.notifications,
      summary: data.summary,
      pagination: data.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getNotificationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.getNotificationById(id);
    res.status(200).json({
      success: true,
      message: 'Notification details retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getSummary(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Analytics summary retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getRevenueAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Revenue analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getOrderAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Order analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getPaymentAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Payment analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getRefundAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Refund analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getProductAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Product analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getCustomerAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Customer analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getCouponAnalytics(req.query as any);
    res.status(200).json({
      success: true,
      message: 'Coupon analytics retrieved',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getSystemHealth = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await healthService.getSystemHealth();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};


// backend/src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';

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

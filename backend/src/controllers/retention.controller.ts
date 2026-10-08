// backend/src/controllers/retention.controller.ts
import { Request, Response, NextFunction } from 'express';
import { wishlistService } from '../services/wishlist.service.js';
import { reorderService } from '../services/reorder.service.js';
import { reviewService } from '../services/review.service.js';
import { backInStockService } from '../services/backInStock.service.js';
import { loyaltyService } from '../services/loyalty.service.js';
import { referralService } from '../services/referral.service.js';
import { recommendationService } from '../services/recommendation.service.js';
import prisma from '../lib/prisma.js';

// ================= WISHLIST CONTROLLER =================

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const wishlist = await wishlistService.getWishlist(userId);
    res.json({ success: true, data: wishlist.items, items: wishlist.items, wishlistId: wishlist.id });
  } catch (err) {
    next(err);
  }
};

export const getWishlistCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await wishlistService.getWishlistCount(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const addWishlistItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.body;
    if (!productId || typeof productId !== 'string') {
      res.status(400).json({ success: false, message: 'productId is required' });
      return;
    }
    const item = await wishlistService.addItem(userId, productId);
    res.status(201).json({ success: true, message: 'Item added to wishlist', data: item });
  } catch (err) {
    next(err);
  }
};

export const removeWishlistItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;
    await wishlistService.removeItem(userId, productId);
    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (err) {
    next(err);
  }
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await wishlistService.clearWishlist(userId);
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (err) {
    next(err);
  }
};

export const moveWishlistToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.params;
    const result = await wishlistService.moveToCart(userId, productId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ================= REORDER CONTROLLER =================

export const reorder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const result = await reorderService.reorder(userId, id);
    res.json({
      success: true,
      message: result.message,
      data: {
        ...result.summary,
        totalAdded: result.summary.added.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ================= REVIEWS CONTROLLER =================

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const productId = req.params.id || req.body.productId;
    if (!productId || typeof productId !== 'string') {
      res.status(400).json({ success: false, message: 'productId is required' });
      return;
    }
    const { rating, title, comment } = req.body;
    const result = await reviewService.createReview(userId, {
      productId,
      rating: Number(rating),
      title,
      comment,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: productId } = req.params;
    const { page, limit } = req.query;
    const result = await reviewService.getProductReviews(productId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getProductRatingSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: productId } = req.params;
    const result = await reviewService.getProductRatingSummary(productId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const reviews = await reviewService.getCustomerReviews(userId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

export const updateMyReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const updated = await reviewService.updateCustomerReview(userId, id, req.body);
    res.json({ success: true, message: 'Review updated and re-entered moderation', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteMyReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    await reviewService.deleteCustomerReview(userId, id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

// Admin Reviews
export const adminGetReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query;
    const result = await reviewService.adminGetReviews({
      status: status as any,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const adminModerateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await reviewService.adminModerateReview(id, status);
    res.json({ success: true, message: `Review status updated to ${status}`, data: updated });
  } catch (err) {
    next(err);
  }
};

export const adminDeleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await reviewService.adminDeleteReview(id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

// ================= BACK-IN-STOCK CONTROLLER =================

export const subscribeBackInStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const productId = req.params.id || req.body.productId;
    const result = await backInStockService.subscribe(userId, productId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const unsubscribeBackInStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const productId = req.params.id || req.body.productId;
    const result = await backInStockService.unsubscribe(userId, productId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getBackInStockStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const productId = req.params.id || req.body.productId;
    const result = await backInStockService.getStatus(userId, productId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getMyBackInStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const list = await backInStockService.getCustomerSubscriptions(userId);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

// ================= LOYALTY CONTROLLER =================

export const getLoyaltyAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const account = await loyaltyService.getAccount(userId);
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
};

export const getLoyaltyTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { page, limit } = req.query;
    const result = await loyaltyService.getTransactions(userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const calculateLoyaltyRedemption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { subtotal, requestedPoints } = req.body;
    const result = await loyaltyService.calculateRedemption(
      userId,
      Number(subtotal) || 0,
      requestedPoints !== undefined ? Number(requestedPoints) : undefined
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ================= REFERRAL CONTROLLER =================

export const getReferralInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const info = await referralService.getReferralInfo(userId);
    res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
};

export const applyReferralCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, message: 'Referral code is required' });
      return;
    }
    const result = await referralService.applyReferralCode(userId, code);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ================= RECOMMENDATIONS CONTROLLER =================

export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { productId, limit } = req.query;
    const products = await recommendationService.getRecommendations({
      productId: typeof productId === 'string' ? productId : undefined,
      userId,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// ================= ACCOUNT SUMMARY CONTROLLER =================

export const getAccountSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const [user, orders, wishlistCount, loyaltyAccount, referralInfo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          shippingStatus: true,
          createdAt: true,
        },
      }),
      wishlistService.getWishlistCount(userId),
      loyaltyService.getAccount(userId),
      referralService.getReferralInfo(userId),
    ]);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const totalOrders = await prisma.order.count({ where: { userId } });
    const activeOrders = orders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    ).length;

    res.json({
      success: true,
      data: {
        profile: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          memberSince: user.createdAt,
        },
        orders: {
          total: totalOrders,
          active: activeOrders,
          recent: orders,
        },
        retention: {
          wishlistCount: wishlistCount.count,
          loyaltyBalance: loyaltyAccount.availableBalance,
          loyaltyPoints: loyaltyAccount.availableBalance,
          lifetimePointsEarned: loyaltyAccount.lifetimeEarned,
          referralCode: referralInfo.referralCode,
          totalReferrals: referralInfo.totalReferred,
          successfulReferrals: referralInfo.successfulReferrals,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ================= ADMIN RETENTION SUMMARY CONTROLLER =================

export const adminGetRetentionSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      pendingReviews,
      approvedReviews,
      rejectedReviews,
      totalWishlistItems,
      totalAccounts,
      totalLoyaltyPoints,
      qualifiedReferrals,
      totalReferrals,
      pendingBackInStock,
    ] = await Promise.all([
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'APPROVED' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.wishlistItem.count(),
      prisma.loyaltyAccount.count(),
      prisma.loyaltyAccount.aggregate({ _sum: { availableBalance: true, lifetimeEarned: true, lifetimeRedeemed: true } }),
      prisma.referral.count({ where: { status: 'QUALIFIED' } }),
      prisma.referral.count(),
      prisma.backInStockSubscription.count(),
    ]);

    const totalReviews = pendingReviews + approvedReviews + rejectedReviews;

    res.json({
      success: true,
      data: {
        reviews: {
          total: totalReviews,
          pending: pendingReviews,
          approved: approvedReviews,
          rejected: rejectedReviews,
        },
        wishlists: {
          totalItems: totalWishlistItems,
        },
        wishlist: {
          totalSavedItems: totalWishlistItems,
        },
        loyalty: {
          totalAccounts,
          circulatingPoints: totalLoyaltyPoints._sum.availableBalance || 0,
          totalEarned: totalLoyaltyPoints._sum.lifetimeEarned || 0,
          totalRedeemed: totalLoyaltyPoints._sum.lifetimeRedeemed || 0,
        },
        referrals: {
          total: totalReferrals,
          qualified: qualifiedReferrals,
          pending: totalReferrals - qualifiedReferrals,
          qualifiedConversions: qualifiedReferrals,
        },
        backInStock: {
          pendingNotifications: pendingBackInStock,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

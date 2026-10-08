// backend/src/services/review.service.ts
import { ReviewStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { notificationService } from './notification/notification.service.js';

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export class ReviewService {
  /**
   * Submit a product review.
   * STRICT VERIFIED PURCHASE RULE:
   * Only customers who have a confirmed or delivered order containing the product can review it.
   */
  async createReview(userId: string, input: CreateReviewInput) {
    const { productId, rating, title, comment } = input;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5');
    }

    if (title && title.length > 100) {
      throw new BadRequestError('Review title cannot exceed 100 characters');
    }

    if (comment && comment.length > 1000) {
      throw new BadRequestError('Review comment cannot exceed 1000 characters');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify verified purchase in authoritative order history
    const qualifyingOrder = await prisma.order.findFirst({
      where: {
        userId,
        items: {
          some: { productId },
        },
        OR: [
          { status: 'DELIVERED' },
          { status: 'CONFIRMED' },
          { paymentStatus: 'CAPTURED' },
        ],
      },
      select: { id: true },
    });

    if (!qualifyingOrder) {
      throw {
        statusCode: 422,
        code: 'VERIFIED_PURCHASE_REQUIRED',
        message: 'Verified purchase required: You can only review products from a confirmed or delivered order',
      };
    }

    // Prevent duplicate review for the same product
    const existing = await prisma.review.findFirst({
      where: { userId, productId },
    });
    if (existing) {
      throw new ConflictError('You have already submitted a review for this product');
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId: qualifyingOrder.id,
        rating,
        title: title?.trim() || null,
        comment: comment?.trim() || null,
        status: ReviewStatus.PENDING,
        isApproved: false,
      },
    });

    return {
      success: true,
      message: 'Review submitted and pending moderation by pantry team',
      data: {
        ...review,
        isVerifiedPurchase: Boolean(review.orderId),
      },
    };
  }

  /**
   * Public list of approved reviews for a product (paginated).
   * Strictly returns APPROVED reviews only. Safe customer attribution (no email, phone, or secrets).
   */
  async getProductReviews(productId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 10), 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          status: ReviewStatus.APPROVED,
        },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          productId,
          status: ReviewStatus.APPROVED,
        },
      }),
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
      customerName: r.user?.name ? r.user.name.split(' ')[0] + ' ***' : 'Verified Buyer',
      verifiedPurchase: true,
      isVerifiedPurchase: true,
    }));

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Authoritative rating summary calculated strictly from APPROVED reviews.
   */
  async getProductRatingSummary(productId: string) {
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      select: { rating: true },
    });

    const totalReviews = approvedReviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution,
      };
    }

    let sum = 0;
    for (const r of approvedReviews) {
      sum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    }

    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    return {
      averageRating,
      totalReviews,
      distribution,
    };
  }

  /**
   * Get reviews submitted by the authenticated customer.
   */
  async getCustomerReviews(userId: string) {
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reviews;
  }

  /**
   * Customer edits their own review.
   */
  async updateCustomerReview(
    userId: string,
    reviewId: string,
    data: { rating?: number; title?: string; comment?: string }
  ) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundError('Review not found or does not belong to you');
    }

    if (data.rating !== undefined) {
      if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
        throw new BadRequestError('Rating must be an integer between 1 and 5');
      }
    }

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: {
        rating: data.rating ?? review.rating,
        title: data.title !== undefined ? data.title?.trim() || null : review.title,
        comment: data.comment !== undefined ? data.comment?.trim() || null : review.comment,
        status: ReviewStatus.PENDING, // Re-enters moderation on edit
        isApproved: false,
      },
    });

    return updated;
  }

  /**
   * Customer deletes their own review.
   */
  async deleteCustomerReview(userId: string, reviewId: string) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundError('Review not found or does not belong to you');
    }

    await prisma.review.delete({ where: { id: review.id } });
    return { success: true };
  }

  // ================= ADMIN METHODS =================

  /**
   * Admin list of reviews (paginated, filterable by status).
   */
  async adminGetReviews(query: { status?: ReviewStatus; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && Object.values(ReviewStatus).includes(query.status)) {
      where.status = query.status;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin moderates review status (APPROVE / REJECT).
   */
  async adminModerateReview(reviewId: string, status: ReviewStatus) {
    if (status !== ReviewStatus.APPROVED && status !== ReviewStatus.REJECTED) {
      throw new BadRequestError('Status must be APPROVED or REJECTED');
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { order: true, user: true },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const isApproved = status === ReviewStatus.APPROVED;
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status,
        isApproved,
      },
    });

    // If approved and orderId exists, trigger notification asynchronously
    if (isApproved && review.orderId) {
      notificationService.dispatchOrderEventAsync({
        orderId: review.orderId,
        type: 'REVIEW_APPROVED',
      });
    }

    return updated;
  }

  /**
   * Admin deletes a review.
   */
  async adminDeleteReview(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }
}

export const reviewService = new ReviewService();

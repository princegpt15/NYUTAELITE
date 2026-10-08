// backend/src/services/wishlist.service.ts
import prisma from '../lib/prisma.js';
import { CartService } from './cart.service.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class WishlistService {
  private cartService = new CartService();

  /**
   * Get customer's wishlist items with active product details.
   */
  async getWishlist(userId: string) {
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                images: true,
                weight: true,
                category: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  compareAtPrice: true,
                  stock: true,
                  images: true,
                  weight: true,
                  category: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });
    }

    return {
      id: wishlist.id,
      userId: wishlist.userId,
      items: wishlist.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: item.product,
      })),
    };
  }

  /**
   * Get count of items in customer's wishlist.
   */
  async getWishlistCount(userId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wishlist) return { count: 0 };

    const count = await prisma.wishlistItem.count({
      where: { wishlistId: wishlist.id },
    });

    return { count };
  }

  /**
   * Add a product to the customer's wishlist.
   * Idempotent: If product already exists in wishlist, returns existing item.
   */
  async addItem(userId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, isActive: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Ensure wishlist exists for user
    const wishlist = await prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Idempotent upsert
    const item = await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      update: {},
      create: {
        wishlistId: wishlist.id,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            images: true,
            isActive: true,
          },
        },
      },
    });

    return item;
  }

  /**
   * Remove a product from the customer's wishlist safely.
   */
  async removeItem(userId: string, productId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wishlist) {
      return { success: true };
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return { success: true };
  }

  /**
   * Clear all items in customer's wishlist.
   */
  async clearWishlist(userId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (wishlist) {
      await prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id },
      });
    }

    return { success: true };
  }

  /**
   * Move item from Wishlist to Cart (Save-For-Later flow).
   * Server strictly revalidates product active status, stock, and CURRENT database price.
   */
  async moveToCart(userId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestError('Product is currently inactive and cannot be moved to cart');
    }

    if (product.stock <= 0) {
      throw { statusCode: 422, code: 'OUT_OF_STOCK', message: 'Product is currently out of stock' };
    }

    // Add to cart with current server-authoritative price
    const primaryImage =
      Array.isArray(product.images) && product.images.length > 0
        ? String(product.images[0])
        : typeof product.images === 'string'
        ? product.images
        : undefined;

    await this.cartService.addItem(userId, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      mrp: product.compareAtPrice ?? product.price,
      image: primaryImage,
    });

    // Remove from wishlist
    await this.removeItem(userId, productId);

    return { success: true, message: 'Item moved to cart with current price' };
  }
}

export const wishlistService = new WishlistService();

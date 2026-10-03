import prisma from '../lib/prisma.js'

type CartItemDto = {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // unit price at time of add
  mrp?: number; // optional compareAtPrice
  image?: string;
};

export class CartService {
  /** Get cart with items for a user, creating an empty cart if none exists */
  async getCart(userId: string) {
    // Find existing cart
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }
    return cart;
  }

  /** Add an item to the cart, upserting if it already exists */
  async addItem(userId: string, dto: CartItemDto) {
    // Ensure cart exists
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existing) {
      // Increment quantity and keep latest price
      return await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: dto.quantity },
          price: dto.price,
          productName: dto.productName,
          image: dto.image,
          mrp: dto.mrp,
        },
      });
    }

    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        productName: dto.productName,
        quantity: dto.quantity,
        price: dto.price,
        mrp: dto.mrp,
        image: dto.image,
      },
    });
  }

  /** Update quantity of a specific product in cart */
  async updateQuantity(userId: string, productId: string, quantity: number) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      throw { statusCode: 404, code: 'CART_NOT_FOUND', message: 'Cart not found' };
    }
    const item = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });
    if (!item) {
      throw { statusCode: 404, code: 'CART_ITEM_NOT_FOUND', message: 'Item not found in cart' };
    }
    if (quantity <= 0) {
      // Remove item when quantity is zero or negative
      await prisma.cartItem.delete({ where: { id: item.id } });
      return null;
    }
    return await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
  }

  /** Remove a product from the cart */
  async removeItem(userId: string, productId: string) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      throw { statusCode: 404, code: 'CART_NOT_FOUND', message: 'Cart not found' };
    }
    const item = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });
    if (!item) {
      throw { statusCode: 404, code: 'CART_ITEM_NOT_FOUND', message: 'Item not found in cart' };
    }
    await prisma.cartItem.delete({ where: { id: item.id } });
    return null;
  }

  /** Clear all items from a user's cart */
  async clearCart(userId: string) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      // If no cart, nothing to clear
      return;
    }
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

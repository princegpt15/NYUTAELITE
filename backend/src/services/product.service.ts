// src/services/product.service.ts
import { PrismaClient } from '@prisma/client';

/**
 * Service class handling product related operations.
 * Provides methods for listing products with pagination and filtering,
 * and retrieving a single product by its ID.
 */
export class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * List products with optional pagination, category filter and search.
   */
  async listProducts(params: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
  }) {
    const { page, limit, category, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * Retrieve a single active product by its ID.
   */
  async getProductById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true },
    });
    if (!product) {
      const err: any = new Error('Product not found');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    return product;
  }
}

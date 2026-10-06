export type MakhanaQuality = 'Premium' | 'Normal';

export interface PantryProduct {
  id: string;
  name: string;
  quality: MakhanaQuality;
  weightGrams: 100 | 200 | 250;
  price: number;
  mrp: number;
  image: string;
  stock: number;
  sku: string;
  slug?: string;
  description: string;
  active: boolean;
}

export interface CartItem {
  productId: string;
  productName: string;
  quality: MakhanaQuality;
  weightGrams: number;
  price: number;
  mrp: number;
  quantity: number;
  image: string;
}

export interface Testimonial {
  id: string;
  rating: number;
  quote: string;
  name: string;
  role: string;
  location: string;
  date?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export type ShippingStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

export interface User {
  id: string;
  fullName: string;
  businessName?: string;
  email: string;
  phone: string;
  gstNumber?: string;
  role?: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

export interface Address {
  id?: string;
  userId?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  landmark?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  razorpayOrderId?: string;
  shippingAddress?: Address | any;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface CreateOrderPayload {
  addressId?: string;
  address?: Omit<Address, 'id' | 'userId' | 'createdAt'>;
  couponCode?: string;
}

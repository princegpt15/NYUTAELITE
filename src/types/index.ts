export interface PricingTier {
  min: number;
  max: number | null;
  label: string;
  pricePerKg: number;
  isPopular?: boolean;
}

export interface ProductDetails {
  id: string;
  name: string;
  eyebrow: string;
  category: string;
  grade: string;
  origin: string;
  shelfLife: string;
  packaging: string;
  minOrder: number;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  description: string;
  badges: string[];
  pricingTiers: PricingTier[];
  images: {
    main: string;
    thumbnails: string[];
  };
  specifications: Record<string, string>;
}

export interface Testimonial {
  id: string;
  rating: number;
  quote: string;
  name: string;
  role: string;
  company: string;
  location: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number; // in KG
  pricePerKg: number;
  subtotal: number;
  image: string;
  grade: string;
}

export interface User {
  id: string;
  fullName: string;
  businessName?: string;
  email: string;
  phone: string;
  gstNumber?: string;
  createdAt: string;
}

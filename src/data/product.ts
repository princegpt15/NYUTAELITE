import type { ProductDetails, PricingTier } from '../types';
import productMainImg from '../assets/images/product-main.png';
import thumb1 from '../assets/images/thumb-1.png';
import thumb2 from '../assets/images/thumb-2.png';
import thumb3 from '../assets/images/thumb-3.png';
import thumb4 from '../assets/images/thumb-4.png';
import featuredImg from '../assets/images/product-featured.png';

export const PRICING_TIERS: PricingTier[] = [
  { min: 10, max: 24, label: '10–24 KG', pricePerKg: 480 },
  { min: 25, max: 49, label: '25–49 KG', pricePerKg: 450, isPopular: true },
  { min: 50, max: 99, label: '50–99 KG', pricePerKg: 420 },
  { min: 100, max: null, label: '100 KG+', pricePerKg: 390 },
];

export const HOME_PRICING_CARDS = [
  {
    tier: '10 KG+',
    role: 'Retailer Bulk',
    price: 480,
    priceNote: 'Starting at ₹480/kg',
    description: 'Perfect for small retailers and grocery stores testing Grade A quality.',
    isPopular: false,
  },
  {
    tier: '25 KG+',
    role: 'Business',
    price: 450,
    priceNote: 'Starting at ₹450/kg',
    description: 'Designed for boutique snack brands, commercial kitchens, and sweet shops.',
    isPopular: false,
  },
  {
    tier: '50 KG+',
    role: 'Wholesale',
    price: 420,
    priceNote: 'Starting at ₹420/kg',
    description: 'Our most sought-after volume tier for regional wholesalers and distributors.',
    isPopular: true,
  },
  {
    tier: '100 KG+',
    role: 'Distributor',
    price: 390,
    priceNote: 'Starting at ₹390/kg',
    description: 'Direct truckload and container rates for large FMCG distributors.',
    isPopular: false,
  },
];

export const PRODUCT: ProductDetails = {
  id: 'premium-makhana-grade-a',
  name: 'NYUTAELITE Premium Makhana — Grade A',
  eyebrow: 'PREMIUM MAKHANA',
  category: 'Premium Indian Makhana / Fox Nuts',
  grade: 'Grade A Premium',
  origin: 'Bihar, India',
  shelfLife: '9 months from packaging date',
  packaging: 'Food-grade vacuum-sealed bulk bags',
  minOrder: 10,
  startingPrice: 450,
  rating: 4.9,
  reviewCount: 128,
  description:
    'Hand-picked, air-popped fox nuts with a light, crisp texture and natural white colour. Processed and packed to meet business-grade quality standards.',
  badges: ['Grade A Quality', 'Lab Tested', 'GST Invoice Ready'],
  pricingTiers: PRICING_TIERS,
  images: {
    main: productMainImg,
    thumbnails: [thumb1, thumb2, thumb3, thumb4],
  },
  specifications: {
    Grade: 'Grade A Premium',
    Weight: '10 KG / 25 KG / 50 KG / 100 KG bulk packs',
    'Shelf Life': '9 months from packaging date',
    Packaging: 'Food-grade vacuum-sealed bulk bags',
    Origin: 'Bihar, India',
    Moisture: '< 10% (optimal crispness)',
    Purity: '99.5% sorted and cleaned',
    Colour: 'Natural pristine white / ivory',
  },
};

export const FEATURED_PRODUCT_IMAGE = featuredImg;

export function getPricePerKg(quantity: number): number {
  if (quantity >= 100) return 390;
  if (quantity >= 50) return 420;
  if (quantity >= 25) return 450;
  return 480;
}

export function getTierForQuantity(quantity: number): PricingTier {
  for (const tier of PRICING_TIERS) {
    if (tier.max === null && quantity >= tier.min) return tier;
    if (tier.max !== null && quantity >= tier.min && quantity <= tier.max) return tier;
  }
  return PRICING_TIERS[0];
}

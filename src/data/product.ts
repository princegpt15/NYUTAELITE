import productImage from '../assets/images/product-main.png';
import type { PantryProduct } from '../types';

export type { MakhanaQuality, PantryProduct } from '../types';

export const PANTRY_PRODUCTS: PantryProduct[] = [
  {
    id: 'premium-100g',
    name: 'Premium Makhana',
    quality: 'Premium',
    weightGrams: 100,
    price: 160,
    mrp: 199,
    image: productImage,
    stock: 150,
    sku: 'NYM-PREM-100',
    description: 'Handpicked jumbo-grade makhana with uniform size, crisp crunch, and minimal shell residue.',
    active: true,
  },
  {
    id: 'premium-200g',
    name: 'Premium Makhana',
    quality: 'Premium',
    weightGrams: 200,
    price: 310,
    mrp: 380,
    image: productImage,
    stock: 120,
    sku: 'NYM-PREM-200',
    description: 'Selected jumbo makhana in a 200g family pack, perfect for daily mindful snacking.',
    active: true,
  },
  {
    id: 'premium-250g',
    name: 'Premium Makhana',
    quality: 'Premium',
    weightGrams: 250,
    price: 380,
    mrp: 460,
    image: productImage,
    stock: 100,
    sku: 'NYM-PREM-250',
    description: 'Generous 250g pack of our highest grade makhana. Exceptional size and uniform texture.',
    active: true,
  },
  {
    id: 'normal-100g',
    name: 'Normal Makhana',
    quality: 'Normal',
    weightGrams: 100,
    price: 120,
    mrp: 150,
    image: productImage,
    stock: 200,
    sku: 'NYM-NORM-100',
    description: 'Standard everyday makhana. Great for roasting, seasoning, or adding to traditional dishes.',
    active: true,
  },
  {
    id: 'normal-200g',
    name: 'Normal Makhana',
    quality: 'Normal',
    weightGrams: 200,
    price: 230,
    mrp: 290,
    image: productImage,
    stock: 180,
    sku: 'NYM-NORM-200',
    description: 'Everyday makhana in a convenient 200g pantry pouch.',
    active: true,
  },
  {
    id: 'normal-250g',
    name: 'Normal Makhana',
    quality: 'Normal',
    weightGrams: 250,
    price: 280,
    mrp: 350,
    image: productImage,
    stock: 160,
    sku: 'NYM-NORM-250',
    description: 'Everyday makhana in a 250g pantry size for roasting and cooking.',
    active: true,
  },
];

export function getPantryProduct(productId: string): PantryProduct | undefined {
  return PANTRY_PRODUCTS.find((product) => product.id === productId && product.active);
}

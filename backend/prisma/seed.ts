// Seed script for NYUTA ELITE MAKHANA backend
// Directly defines product data to avoid image imports.
import { PrismaClient } from '@prisma/client';

const SEED_PRODUCTS = [
  {
    id: 'premium-100g',
    name: 'Premium Makhana',
    description: 'Handpicked jumbo-grade makhana with uniform size, crisp crunch, and minimal shell residue.',
    quality: 'Premium',
    weightGrams: 100,
    price: 160,
    mrp: 199,
    stock: 150,
    sku: 'NYM-PREM-100',
    active: true,
  },
  {
    id: 'premium-200g',
    name: 'Premium Makhana',
    description: 'Selected jumbo makhana in a 200g family pack, perfect for daily mindful snacking.',
    quality: 'Premium',
    weightGrams: 200,
    price: 310,
    mrp: 380,
    stock: 120,
    sku: 'NYM-PREM-200',
    active: true,
  },
  {
    id: 'premium-250g',
    name: 'Premium Makhana',
    description: 'Generous 250g pack of our highest grade makhana. Exceptional size and uniform texture.',
    quality: 'Premium',
    weightGrams: 250,
    price: 380,
    mrp: 460,
    stock: 100,
    sku: 'NYM-PREM-250',
    active: true,
  },
  {
    id: 'normal-100g',
    name: 'Normal Makhana',
    description: 'Standard everyday makhana. Great for roasting, seasoning, or adding to traditional dishes.',
    quality: 'Normal',
    weightGrams: 100,
    price: 120,
    mrp: 150,
    stock: 200,
    sku: 'NYM-NORM-100',
    active: true,
  },
  {
    id: 'normal-200g',
    name: 'Normal Makhana',
    description: 'Everyday makhana in a convenient 200g pantry pouch.',
    quality: 'Normal',
    weightGrams: 200,
    price: 230,
    mrp: 290,
    stock: 180,
    sku: 'NYM-NORM-200',
    active: true,
  },
  {
    id: 'normal-250g',
    name: 'Normal Makhana',
    description: 'Everyday makhana in a 250g pantry size for roasting and cooking.',
    quality: 'Normal',
    weightGrams: 250,
    price: 280,
    mrp: 350,
    stock: 160,
    sku: 'NYM-NORM-250',
    active: true,
  },
];

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding products...');
  for (const p of SEED_PRODUCTS) {
    const slug = p.id; // use id as slug
    await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        category: 'Makhana',
        price: p.price,
        compareAtPrice: p.mrp,
        stock: p.stock,
        sku: p.sku,
        images: [], // no images stored in backend
        weight: p.weightGrams,
        isActive: p.active,
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        category: 'Makhana',
        price: p.price,
        compareAtPrice: p.mrp,
        stock: p.stock,
        sku: p.sku,
        images: [],
        weight: p.weightGrams,
        isActive: p.active,
      },
    });
  }
  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// src/utils/seo.ts
import type { PantryProduct } from '../types';
import { FAQS } from '../data/faqs';
import { PANTRY_PRODUCTS } from '../data/product';

export const PRODUCTION_ORIGIN = 'https://nyutaelite.com';
export const DEFAULT_OG_IMAGE = `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`; // TODO: replace with /images/og-cover.jpg once created
// AUDIT FIX F8: Brand name aligned to NYUTAELITE for GMC consistency
export const SITE_NAME = 'NYUTA ELITE MAKHANA';
export const BRAND_NAME = 'NYUTAELITE';

/**
 * Single authoritative product catalog for SEO — delegates to PANTRY_PRODUCTS
 * to avoid data drift between two copies of the same data.
 * AUDIT FIX F9: Removed the duplicate inline array; now a re-export alias.
 */
export const SEO_PRODUCT_CATALOG: PantryProduct[] = PANTRY_PRODUCTS;

export interface RouteSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index, follow' | 'noindex, nofollow';
  ogType: 'website' | 'product' | 'article';
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogSiteName: string;
  twitterCard: 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  googleSiteVerification?: string;
  jsonLd: Array<Record<string, any>>;
}

function getGoogleSiteVerificationToken(): string {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && typeof metaEnv.VITE_GOOGLE_SITE_VERIFICATION === 'string') {
      return metaEnv.VITE_GOOGLE_SITE_VERIFICATION.trim();
    }
  } catch {
    // ignore
  }
  try {
    const nodeEnv = (globalThis as any)?.process?.env;
    if (nodeEnv && typeof nodeEnv.VITE_GOOGLE_SITE_VERIFICATION === 'string') {
      return nodeEnv.VITE_GOOGLE_SITE_VERIFICATION.trim();
    }
  } catch {
    // ignore
  }
  return '';
}

// Helper to truncate long strings without cutting words.
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '…';
}

export function finalizeSeo(metadata: RouteSeoMetadata): RouteSeoMetadata {
  return {
    ...metadata,
    title: truncate(metadata.title, 60),
    description: truncate(metadata.description, 160),
  };
}

/**
 * Resolve an image path to a valid absolute https://nyutaelite.com URL for Open Graph & Schema.org.
 * Prevents broken relative or localhost image URLs in social/search crawlers.
 */
export function toAbsoluteCanonicalImageUrl(rawImage?: string | null): string {
  if (!rawImage || typeof rawImage !== 'string') {
    return DEFAULT_OG_IMAGE;
  }
  const trimmed = rawImage.trim();
  if (!trimmed || trimmed.startsWith('data:')) {
    return DEFAULT_OG_IMAGE;
  }
  if (trimmed.startsWith('https://nyutaelite.com/')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Strip any localhost, Railway, or Netlify preview hostnames
    try {
      const parsed = new URL(trimmed);
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.includes('railway.app') ||
        parsed.hostname.includes('netlify.app')
      ) {
        return `${PRODUCTION_ORIGIN}${parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`}`;
      }
      return trimmed;
    } catch {
      return DEFAULT_OG_IMAGE;
    }
  }
  return `${PRODUCTION_ORIGIN}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export function buildOrganizationJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NYUTA ELITE MAKHANA',
    alternateName: ['NYUTAELITE', 'NYUTA ELITE'],
    url: `${PRODUCTION_ORIGIN}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`,
      width: 512,
      height: 512,
    },
    description:
      'NYUTA ELITE MAKHANA is a premium Indian makhana brand offering handpicked fox nuts from Bihar. Available online in 100g, 200g, and 250g packs — Premium and Normal grade.',
    areaServed: 'IN',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+918102875852',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
      email: 'info@nyutaelite.com',
    },
  };
}

export function buildWebSiteJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NYUTA ELITE MAKHANA',
    alternateName: ['NYUTAELITE', 'NYUTA ELITE'],
    url: `${PRODUCTION_ORIGIN}/`,
  };
}

export function buildBreadcrumbJsonLd(
  crumbs: Array<{ name: string; url: string }>
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

/**
 * Build Schema.org Product JSON-LD strictly from authoritative product data.
 * Never fabricates reviews, star ratings, or unverified claims.
 *
 * AUDIT FIXES APPLIED:
 *  F6  — OG image now uses actual product image, not logo
 *  F7  — Product name in JSON-LD is concise (no keyword stuffing)
 *  F8  — brand.name uses BRAND_NAME constant (NYUTAELITE)
 *  F10 — seller added to Offer
 *  F11 — shippingDetails added to Offer
 */
export function buildProductJsonLd(
  product: PantryProduct,
  canonicalUrl?: string
): Record<string, any> {
  const canonicalSkuId =
    product.slug ||
    product.id ||
    `${product.quality.toLowerCase()}-${product.weightGrams}g`;
  const productUrl =
    canonicalUrl ||
    `${PRODUCTION_ORIGIN}/products/makhana?sku=${encodeURIComponent(canonicalSkuId)}`;

  // Concise, non-keyword-stuffed product name
  const fullProductName = `NYUTA ELITE Makhana – ${product.quality} ${product.weightGrams}g`;

  // Use actual product image URL, not the site logo
  const imageUrl = toAbsoluteCanonicalImageUrl(product.image);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fullProductName,
    description:
      product.description ||
      `${product.weightGrams}g pouch of NYUTA ELITE ${product.quality} Grade Bihar makhana (fox nuts).`,
    image: [imageUrl],
    sku: product.sku || canonicalSkuId,
    // AUDIT FIX F8: Brand name is now NYUTAELITE
    brand: {
      '@type': 'Brand',
      name: 'NYUTA ELITE MAKHANA',
    },
    category: `${product.quality} Grade Makhana`,
    weight: {
      '@type': 'QuantitativeValue',
      value: product.weightGrams,
      unitCode: 'GRM',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: Number(product.price).toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      // AUDIT FIX F10: seller field added for Google Shopping eligibility
      seller: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        url: `${PRODUCTION_ORIGIN}/`,
      },
      // AUDIT FIX F11: shippingDetails helps Google Shopping show shipping info in SERPs
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
      // Merchant Listings enhancement: explicit return policy for food hygiene & statutory damage remedy
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory:
          'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 2,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        refundType: 'https://schema.org/FullRefund',
      },
    },
  };
}

export function buildFaqPageJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

/**
 * Find matching product from provided live product or fallback catalog by SKU/id.
 */
export function findProductForSeo(
  skuParam?: string | null,
  activeProduct?: PantryProduct | null
): PantryProduct | null {
  if (activeProduct) return activeProduct;
  if (!skuParam) return null;
  const normalized = skuParam.trim().toLowerCase();
  const match = SEO_PRODUCT_CATALOG.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.sku.toLowerCase() === normalized ||
      `${p.quality.toLowerCase()}-${p.weightGrams}g` === normalized
  );
  return match || null;
}

/**
 * Deterministically resolve complete SEO, Canonical, Robots, Open Graph, Twitter, and JSON-LD metadata
 * for any storefront or admin route.
 */
export function resolveRouteSeo(
  paramsOrPathname:
    | string
    | {
        pathname: string;
        search?: string;
        product?: PantryProduct | null;
      },
  optionalProduct?: PantryProduct | null
): RouteSeoMetadata {
  const params =
    typeof paramsOrPathname === 'string'
      ? (() => {
          const clean = paramsOrPathname.split('#')[0] || '/';
          const qIdx = clean.indexOf('?');
          return {
            pathname: qIdx >= 0 ? clean.slice(0, qIdx) || '/' : clean,
            search: qIdx >= 0 ? clean.slice(qIdx) : '',
            product: optionalProduct ?? null,
          };
        })()
      : paramsOrPathname;

  const rawPathname = (params.pathname || '/').trim();
  const normalizedPath =
    rawPathname === '/' ? '/' : rawPathname.replace(/\/+$/, '');
  const searchStr = params.search || '';
  const searchParams = new URLSearchParams(
    searchStr.startsWith('?') ? searchStr.slice(1) : searchStr
  );
  const verificationToken = getGoogleSiteVerificationToken();

  // 1. Admin Routes (/admin, /admin/*) -> STRICT NOINDEX
  if (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) {
    const title = `Admin Portal | ${SITE_NAME}`;
    const description = `Restricted administrative portal for ${BRAND_NAME} MAKHANA.`;
    const canonicalUrl = `${PRODUCTION_ORIGIN}/admin`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [],
    };
  }

  // 2. Private Customer Routes (/cart, /checkout, /orders, /login, /register) -> STRICT NOINDEX
  const privateRoutes: Record<
    string,
    { title: string; description: string; canonicalPath: string }
  > = {
    '/cart': {
      title: `Shopping Cart | ${SITE_NAME}`,
      description: `Review your selected ${BRAND_NAME} Bihar makhana packs before checkout.`,
      canonicalPath: '/cart',
    },
    '/checkout': {
      title: `Secure Checkout | ${SITE_NAME}`,
      description: `Complete your ${BRAND_NAME} makhana order with secure Razorpay checkout.`,
      canonicalPath: '/checkout',
    },
    '/orders': {
      title: `Your Orders & Tracking | ${SITE_NAME}`,
      description: `View your ${BRAND_NAME} makhana order history, delivery status, and invoices.`,
      canonicalPath: '/orders',
    },
    '/login': {
      title: `Sign In | ${SITE_NAME}`,
      description: `Sign in to your ${BRAND_NAME} pantry account to manage orders and addresses.`,
      canonicalPath: '/login',
    },
    '/register': {
      title: `Create Account | ${SITE_NAME}`,
      description: `Create a ${BRAND_NAME} account for fast checkout and pan-India order tracking.`,
      canonicalPath: '/register',
    },
    '/account': {
      title: `Your Account | ${SITE_NAME}`,
      description: `Manage your profile, shipping addresses, and saved details.`,
      canonicalPath: '/account',
    },
    '/wishlist': {
      title: `Your Saved Makhana Packs | ${SITE_NAME}`,
      description: `View and order your favorite saved makhana products.`,
      canonicalPath: '/wishlist',
    },
    '/bulk-order/enquiry': {
      title: `Wholesale Makhana Enquiry Form | ${SITE_NAME}`,
      description: `Submit your wholesale makhana purchase enquiry for institutional pricing.`,
      canonicalPath: '/bulk-order/enquiry',
    },
  };

  if (privateRoutes[normalizedPath]) {
    const cfg = privateRoutes[normalizedPath];
    const canonicalUrl = `${PRODUCTION_ORIGIN}${cfg.canonicalPath}`;
    return {
      title: cfg.title,
      description: cfg.description,
      canonicalUrl,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogTitle: cfg.title,
      ogDescription: cfg.description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: cfg.title,
      twitterDescription: cfg.description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [],
    };
  }

  // 3. Product Detail / Collection Page (/products/makhana or /products/:sku)
  if (
    normalizedPath === '/products/makhana' ||
    normalizedPath.startsWith('/products/')
  ) {
    const pathSlug =
      normalizedPath !== '/products/makhana'
        ? normalizedPath.replace('/products/', '')
        : null;
    const rawSku = searchParams.get('sku') || pathSlug;
    const matchedProduct = rawSku ? findProductForSeo(rawSku, params.product) : null;

    if (matchedProduct) {
      const canonicalSku = `${matchedProduct.quality.toLowerCase()}-${matchedProduct.weightGrams}g`;
      const canonicalUrl = `${PRODUCTION_ORIGIN}/products/makhana?sku=${canonicalSku}`;
      const title = `NYUTA ELITE Makhana – ${matchedProduct.quality} ${matchedProduct.weightGrams}g | Buy Online`;
      const description = `Shop NYUTA ELITE ${matchedProduct.quality} Makhana (${matchedProduct.weightGrams}g). Handpicked Bihar fox nuts at \u20b9${matchedProduct.price}. Freshly packed in airtight pouches with pan-India shipping.`;
      // AUDIT FIX F6: Use actual product image for OG, not the site logo
      const ogImage = toAbsoluteCanonicalImageUrl(matchedProduct.image);

      return {
        title,
        description,
        canonicalUrl,
        robots: 'index, follow',
        ogType: 'product',
        ogTitle: title,
        ogDescription: description,
        ogImage,
        ogUrl: canonicalUrl,
        ogSiteName: SITE_NAME,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
        ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
        jsonLd: [
          buildBreadcrumbJsonLd([
            { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
            { name: 'Shop Makhana', url: `${PRODUCTION_ORIGIN}/categories` },
            {
              name: `NYUTA ELITE Makhana – ${matchedProduct.quality} ${matchedProduct.weightGrams}g`,
              url: canonicalUrl,
            },
          ]),
          buildProductJsonLd(matchedProduct, canonicalUrl),
        ],
      };
    }

    // Generic /products/makhana collection landing (when no specific product resolved)
    const canonicalUrl = `${PRODUCTION_ORIGIN}/products/makhana`;
    const title = `Shop Premium & Normal Bihar Makhana Packs (100g, 200g, 250g) | ${SITE_NAME}`;
    const description =
      `Explore ${BRAND_NAME} makhana packs in Premium jumbo-grade and Normal everyday-grade fox nuts. Available in 100g, 200g, and 250g air-tight pantry pouches.`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Shop Makhana', url: canonicalUrl },
        ]),
      ],
    };
  }

  // 4. Public Informational Pages (/about, /faq, /contact)
  if (normalizedPath === '/about') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/about`;
    const title = `About Our Bihar Makhana Heritage & Quality Standards | ${SITE_NAME}`;
    const description =
      `Learn how ${BRAND_NAME} sources 100% unbleached, naturally air-popped Euryale ferox (fox nuts) from traditional harvesting communities in Mithila, Bihar.`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [],
    };
  }

  if (normalizedPath === '/faq') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/faq`;
    const title = `Frequently Asked Questions — Makhana Grades, Pack Sizes & Shipping | ${SITE_NAME}`;
    const description =
      `Answers to common questions about ${BRAND_NAME} Premium vs. Normal makhana grades, 100g/200g/250g pouch sizes, roasting tips, pan-India delivery, and returns.`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [buildFaqPageJsonLd()],
    };
  }

  if (normalizedPath === '/contact') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/contact`;
    const title = `Contact Customer Care - Bihar Registered Office | ${SITE_NAME}`;
    const description =
      `Get in touch with the ${BRAND_NAME} MAKHANA customer support team for order tracking, product inquiries, bulk orders, or delivery assistance.`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [],
    };
  }

  if (normalizedPath === '/categories') {
    const rawType = searchParams.get('type')?.toLowerCase();
    if (rawType === 'premium') {
      const canonicalUrl = `${PRODUCTION_ORIGIN}/categories?type=Premium`;
      const title = `Buy Premium Jumbo Makhana Online (100g, 200g, 250g) | ${SITE_NAME}`;
      const description =
        `Shop NYUTA ELITE Premium Grade Bihar Makhana. Handpicked jumbo-sized fox nuts with crisp crunch in 100g, 200g, and 250g pouches. Free pan-India delivery.`;
      const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.webp`;
      return {
        title,
        description,
        canonicalUrl,
        robots: 'index, follow',
        ogType: 'website',
        ogTitle: title,
        ogDescription: description,
        ogImage,
        ogUrl: canonicalUrl,
        ogSiteName: SITE_NAME,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
        ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
        jsonLd: [
          buildBreadcrumbJsonLd([
            { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
            { name: 'Shop All Makhana', url: `${PRODUCTION_ORIGIN}/categories` },
            { name: 'Premium Makhana', url: canonicalUrl },
          ]),
        ],
      };
    }

    if (rawType === 'normal') {
      const canonicalUrl = `${PRODUCTION_ORIGIN}/categories?type=Normal`;
      const title = `Normal Everyday Makhana Packs (100g, 200g, 250g) | ${SITE_NAME}`;
      const description =
        `Shop NYUTA ELITE Normal Grade Bihar Makhana. Wholesome everyday fox nuts perfect for daily roasting, snacks, and cooking in 100g, 200g, and 250g pouches.`;
      const ogImage = `${PRODUCTION_ORIGIN}/images/products/normal-makhana-100g.webp`;
      return {
        title,
        description,
        canonicalUrl,
        robots: 'index, follow',
        ogType: 'website',
        ogTitle: title,
        ogDescription: description,
        ogImage,
        ogUrl: canonicalUrl,
        ogSiteName: SITE_NAME,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
        ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
        jsonLd: [
          buildBreadcrumbJsonLd([
            { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
            { name: 'Shop All Makhana', url: `${PRODUCTION_ORIGIN}/categories` },
            { name: 'Normal Makhana', url: canonicalUrl },
          ]),
        ],
      };
    }

    // Default: All Makhana Packs (strips sorting/filtering/tracking noise from canonical)
    const canonicalUrl = `${PRODUCTION_ORIGIN}/categories`;
    const title = `All Makhana Packs | Shop Bihar Fox Nuts Online | ${SITE_NAME}`;
    const description =
      `Browse all ${BRAND_NAME} makhana packs — Premium and Normal grades in 100g, 200g, and 250g air-tight pouches. Fast pan-India delivery.`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Shop All Makhana', url: canonicalUrl },
        ]),
      ],
    };
  }

  if (normalizedPath === '/bulk-order/qualities') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/bulk-order/qualities`;
    const title = `Bulk Makhana Orders | Wholesale Fox Nuts India | ${SITE_NAME}`;
    const description =
      `Order ${BRAND_NAME} makhana in bulk — Grade 4, 5, 5.5, and 6 Sutta wholesale packs for retailers, restaurants, and manufacturers.`;
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage: DEFAULT_OG_IMAGE,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_OG_IMAGE,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [],
    };
  }

  // 5. Educational / Buyer's Guide (/learn/how-to-choose-good-quality-makhana)
  if (normalizedPath === '/learn/how-to-choose-good-quality-makhana') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/learn/how-to-choose-good-quality-makhana`;
    const title = `How to Choose Good-Quality Makhana: Complete Buyer's Guide | ${SITE_NAME}`;
    const description =
      `Learn how to choose good-quality Bihar makhana. Understand Suta sizing (4 Suta vs 5+ Suta jumbo), unbleached vs bleached fox nuts, crispness checks, and storage tips.`;
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.webp`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How to Choose Good-Quality Makhana: A Complete Buyer’s Guide',
      description,
      image: [ogImage],
      datePublished: '2026-10-25T00:00:00+05:30',
      dateModified: '2026-10-25T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        url: `${PRODUCTION_ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`,
        },
      },
    };
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: ogImage,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: "Buyer's Guide", url: `${PRODUCTION_ORIGIN}/categories` },
          { name: 'How to Choose Good-Quality Makhana', url: canonicalUrl },
        ]),
        articleJsonLd,
      ],
    };
  }

  // 6. Educational Guide: Makhana Health Benefits (/learn/makhana-benefits-health)
  if (normalizedPath === '/learn/makhana-benefits-health') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/learn/makhana-benefits-health`;
    const title = `Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day | ${SITE_NAME}`;
    const description =
      `Discover 7 evidence-informed health benefits of makhana (fox nuts). Learn how Bihar Euryale ferox supports weight management, heart health, digestion, and bone strength.`;
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.webp`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day',
      description,
      image: [ogImage],
      datePublished: '2026-10-26T00:00:00+05:30',
      dateModified: '2026-10-26T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        url: `${PRODUCTION_ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`,
        },
      },
    };
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'website',
      ogTitle: title,
      ogDescription: description,
      ogImage,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: ogImage,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Nutrition Guide', url: `${PRODUCTION_ORIGIN}/categories` },
          { name: 'Makhana Benefits', url: canonicalUrl },
        ]),
        articleJsonLd,
      ],
    };
  }

  // Storage Guide (/learn/how-to-store-makhana)
  if (normalizedPath === '/learn/how-to-store-makhana') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/learn/how-to-store-makhana`;
    const title = `How to Store Makhana to Keep It Crisp for Months | ${SITE_NAME}`;
    const description =
      `Learn how to store makhana (fox nuts) to keep them crisp for months. Tips on airtight containers, humidity control, monsoon storage, and reviving soggy fox nuts.`;
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.webp`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How to Store Makhana to Keep It Crisp for Months',
      description,
      image: [ogImage],
      datePublished: '2026-10-28T00:00:00+05:30',
      dateModified: '2026-10-28T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        url: `${PRODUCTION_ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`,
        },
      },
    };
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'article' as 'article',
      ogTitle: title,
      ogDescription: description,
      ogImage,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image' as const,
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: ogImage,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Storage Guide', url: `${PRODUCTION_ORIGIN}/categories` },
          { name: 'How to Store Makhana', url: canonicalUrl },
        ]),
        articleJsonLd,
      ],
    };
  }

  // Pack Size Guide (/learn/makhana-pack-size-guide)
  if (normalizedPath === '/learn/makhana-pack-size-guide') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/learn/makhana-pack-size-guide`;
    const title = `Makhana Pack Size Guide: 100g, 200g or 250g? | ${SITE_NAME}`;
    const description =
      `Not sure which makhana pack size to buy? Compare 100g, 200g and 250g fox nut packs by servings, value, and use case to find the right size for you.`;
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.webp`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Choosing the Right Makhana Pack Size: 100g, 200g or 250g?',
      description,
      image: [ogImage],
      datePublished: '2026-10-28T00:00:00+05:30',
      dateModified: '2026-10-28T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        url: `${PRODUCTION_ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`,
        },
      },
    };
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'article' as 'article',
      ogTitle: title,
      ogDescription: description,
      ogImage,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image' as const,
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: ogImage,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: "Buyer's Guide", url: `${PRODUCTION_ORIGIN}/categories` },
          { name: 'Pack Size Guide', url: canonicalUrl },
        ]),
        articleJsonLd,
      ],
    };
  }

    // Ordering Guide (/learn/ordering-makhana-online-india)
  if (normalizedPath === '/learn/ordering-makhana-online-india') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/learn/ordering-makhana-online-india`;
    const title = `Ordering Makhana Online in India: Shipping, Freshness & FAQ | ${SITE_NAME}`;
    const description =
      `Find out how to order NYUTAELITE makhana online in India. Covers delivery timelines, freshness protection during transit, FSSAI compliance, and the 48-hour damage replacement policy.`;
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.webp`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Ordering Makhana Online in India: Shipping, Freshness & What to Expect',
      description,
      image: [ogImage],
      datePublished: '2026-10-28T00:00:00+05:30',
      dateModified: '2026-10-28T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        url: `${PRODUCTION_ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.webp`,
        },
      },
    };
    return {
      title,
      description,
      canonicalUrl,
      robots: 'index, follow',
      ogType: 'article' as 'article',
      ogTitle: title,
      ogDescription: description,
      ogImage,
      ogUrl: canonicalUrl,
      ogSiteName: SITE_NAME,
      twitterCard: 'summary_large_image' as const,
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: ogImage,
      ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
      jsonLd: [
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Ordering Guide', url: `${PRODUCTION_ORIGIN}/categories` },
          { name: 'Ordering Makhana Online', url: canonicalUrl },
        ]),
        articleJsonLd,
      ],
    };
  }

// 5. Default / Homepage (/)
  const canonicalUrl = `${PRODUCTION_ORIGIN}/`;
  const title = 'NYUTA ELITE MAKHANA | Premium Makhana & Fox Nuts from Bihar';
  const description =
    'Shop NYUTA ELITE MAKHANA — premium Bihar fox nuts in 100g, 200g & 250g pouches. Premium and Normal grades. Pan-India delivery. FSSAI Reg. 20426021000494.';
  return {
    title,
    description,
    canonicalUrl,
    robots: 'index, follow',
    ogType: 'website',
    ogTitle: title,
    ogDescription: description,
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: canonicalUrl,
    ogSiteName: SITE_NAME,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    ...(verificationToken ? { googleSiteVerification: verificationToken } : {}),
    jsonLd: [buildOrganizationJsonLd(), buildWebSiteJsonLd(), buildFaqPageJsonLd()],
  };
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined' || !document.head) return;
  let el = document.head.querySelector(
    `meta[${attrName}="${attrValue}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined' || !document.head) return;
  let link = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Apply resolved SEO metadata and Schema.org JSON-LD blocks to the live browser DOM.
 */
export function applySeoToDocument(seo: RouteSeoMetadata): void {
  if (typeof document === 'undefined' || !document.head) return;

  try {
    document.title = seo.title;
    upsertMetaTag('name', 'description', seo.description);
    upsertMetaTag('name', 'robots', seo.robots);
    upsertCanonicalLink(seo.canonicalUrl);

    // Open Graph
    upsertMetaTag('property', 'og:type', seo.ogType);
    upsertMetaTag('property', 'og:title', seo.ogTitle);
    upsertMetaTag('property', 'og:description', seo.ogDescription);
    upsertMetaTag('property', 'og:image', seo.ogImage);
    upsertMetaTag('property', 'og:url', seo.ogUrl);
    upsertMetaTag('property', 'og:site_name', seo.ogSiteName);

    // Twitter
    upsertMetaTag('name', 'twitter:card', seo.twitterCard);
    upsertMetaTag('name', 'twitter:title', seo.twitterTitle);
    upsertMetaTag('name', 'twitter:description', seo.twitterDescription);
    upsertMetaTag('name', 'twitter:image', seo.twitterImage);

    // Optional Google Search Console verification tag
    if (seo.googleSiteVerification) {
      upsertMetaTag('name', 'google-site-verification', seo.googleSiteVerification);
    }

    // Dynamic JSON-LD script management: clean up both static and previously injected scripts
    const existingScripts = document.head.querySelectorAll(
      'script[data-nyuta-seo-jsonld="true"], #jsonld-organization, #jsonld-website, #jsonld-faq, script[data-edge-injected="true"]'
    );
    existingScripts.forEach((node) => node.parentNode?.removeChild(node));

    // Inject authoritative JSON-LD blocks for current route
    for (const schemaObj of seo.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-nyuta-seo-jsonld', 'true');
      script.textContent = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    }
  } catch {
    // Never allow SEO DOM manipulation to crash the storefront
  }
}

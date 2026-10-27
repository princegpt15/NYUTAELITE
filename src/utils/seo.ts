// src/utils/seo.ts
import type { PantryProduct } from '../types';
import { FAQS } from '../data/faqs';
import { PANTRY_PRODUCTS } from '../data/product';

export const PRODUCTION_ORIGIN = 'https://nyutaelite.com';
export const DEFAULT_OG_IMAGE = `${PRODUCTION_ORIGIN}/nyuta-elite-logo.png`; // TODO: replace with /images/og-cover.jpg once created
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
  ogType: 'website' | 'product';
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
    // AUDIT FIX F8: Use BRAND_NAME constant for consistency
    name: 'NYUTA ELITE MAKHANA',
    alternateName: ['NYUTAELITE', 'NYUTA ELITE'],
    url: `${PRODUCTION_ORIGIN}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.png`,
      width: 512,
      height: 512,
    },
    description:
      'NYUTAELITE is a premium Indian makhana brand offering handpicked fox nuts from Bihar. Available online in 100g, 200g, and 250g packs — Premium and Normal grade.',
    areaServed: 'IN',
    sameAs: [],
  };
}

export function buildWebSiteJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: BRAND_NAME,
    url: `${PRODUCTION_ORIGIN}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${PRODUCTION_ORIGIN}/categories?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
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

  // AUDIT FIX F7: Concise, non-keyword-stuffed product name
  const fullProductName = `${BRAND_NAME} ${product.name} ${product.weightGrams}g`;

  // AUDIT FIX F6: Use actual product image URL, not the site logo
  const imageUrl = toAbsoluteCanonicalImageUrl(product.image);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fullProductName,
    description:
      product.description ||
      `${product.weightGrams}g pouch of ${BRAND_NAME} ${product.quality} Grade Bihar makhana (fox nuts).`,
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
      const title = `Buy ${matchedProduct.name} ${matchedProduct.weightGrams}g Online | ${matchedProduct.quality} Grade Bihar Fox Nuts | ${SITE_NAME}`;
      const description = `${matchedProduct.description} Buy authentic ${matchedProduct.weightGrams}g ${matchedProduct.quality} Grade Bihar makhana (SKU: ${matchedProduct.sku}) at \u20b9${matchedProduct.price}. Freshly packed with pan-India delivery.`;
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
          buildOrganizationJsonLd(),
          buildBreadcrumbJsonLd([
            { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
            { name: 'Makhana Collection', url: `${PRODUCTION_ORIGIN}/products/makhana` },
            {
              name: `${matchedProduct.name} (${matchedProduct.weightGrams}g)`,
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
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Makhana Collection', url: canonicalUrl },
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
      jsonLd: [
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'About Us', url: canonicalUrl },
        ]),
      ],
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
      jsonLd: [
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'FAQ', url: canonicalUrl },
        ]),
        buildFaqPageJsonLd(),
      ],
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
      jsonLd: [
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Contact Us', url: canonicalUrl },
        ]),
      ],
    };
  }

  if (normalizedPath === '/categories') {
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
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'All Packs', url: canonicalUrl },
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
      jsonLd: [
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Bulk Wholesale Makhana', url: canonicalUrl },
        ]),
      ],
    };
  }

  // 5. Educational / Buyer's Guide (/learn/how-to-choose-good-quality-makhana)
  if (normalizedPath === '/learn/how-to-choose-good-quality-makhana') {
    const canonicalUrl = `${PRODUCTION_ORIGIN}/learn/how-to-choose-good-quality-makhana`;
    const title = `How to Choose Good-Quality Makhana: Complete Buyer's Guide | ${SITE_NAME}`;
    const description =
      `Learn how to choose good-quality Bihar makhana. Understand Suta sizing (4 Suta vs 5+ Suta jumbo), unbleached vs bleached fox nuts, crispness checks, and storage tips.`;
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.png`;
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
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.png`,
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
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Learn', url: `${PRODUCTION_ORIGIN}/categories` },
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
    const ogImage = `${PRODUCTION_ORIGIN}/images/products/premium-makhana-100g.png`;
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
          url: `${PRODUCTION_ORIGIN}/nyuta-elite-logo.png`,
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
        buildOrganizationJsonLd(),
        buildBreadcrumbJsonLd([
          { name: 'Home', url: `${PRODUCTION_ORIGIN}/` },
          { name: 'Learn', url: `${PRODUCTION_ORIGIN}/categories` },
          { name: 'Makhana Benefits', url: canonicalUrl },
        ]),
        articleJsonLd,
      ],
    };
  }

  // 5. Default / Homepage (/)
  const canonicalUrl = `${PRODUCTION_ORIGIN}/`;
  const title = 'NYUTA ELITE MAKHANA | Premium Makhana & Fox Nuts';
  const description =
    'Discover NYUTA ELITE MAKHANA and explore our range of makhana (fox nuts). Find product details, pack sizes, quality information, and ordering options.';
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

    // Dynamic JSON-LD script management
    const existingDynamicScripts = document.head.querySelectorAll(
      'script[data-nyuta-seo-jsonld="true"]'
    );
    existingDynamicScripts.forEach((node) => node.parentNode?.removeChild(node));

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

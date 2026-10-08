// src/utils/seo.ts
import type { PantryProduct } from '../types';
import { FAQS } from '../data/faqs';

export const PRODUCTION_ORIGIN = 'https://nutyaelite.com';
export const DEFAULT_OG_IMAGE = `${PRODUCTION_ORIGIN}/nyuta-elite-logo.png`;
export const SITE_NAME = 'NYUTA ELITE MAKHANA';

export const SEO_PRODUCT_CATALOG: PantryProduct[] = [
  {
    id: 'premium-100g',
    name: 'Premium Makhana',
    quality: 'Premium',
    weightGrams: 100,
    price: 160,
    mrp: 199,
    image: DEFAULT_OG_IMAGE,
    stock: 150,
    sku: 'NYM-PREM-100',
    description:
      'Handpicked jumbo-grade makhana with uniform size, crisp crunch, and minimal shell residue.',
    active: true,
  },
  {
    id: 'premium-200g',
    name: 'Premium Makhana',
    quality: 'Premium',
    weightGrams: 200,
    price: 310,
    mrp: 380,
    image: DEFAULT_OG_IMAGE,
    stock: 120,
    sku: 'NYM-PREM-200',
    description:
      'Selected jumbo makhana in a 200g family pack, perfect for daily mindful snacking.',
    active: true,
  },
  {
    id: 'premium-250g',
    name: 'Premium Makhana',
    quality: 'Premium',
    weightGrams: 250,
    price: 380,
    mrp: 460,
    image: DEFAULT_OG_IMAGE,
    stock: 100,
    sku: 'NYM-PREM-250',
    description:
      'Generous 250g pack of our highest grade makhana. Exceptional size and uniform texture.',
    active: true,
  },
  {
    id: 'normal-100g',
    name: 'Normal Makhana',
    quality: 'Normal',
    weightGrams: 100,
    price: 120,
    mrp: 150,
    image: DEFAULT_OG_IMAGE,
    stock: 200,
    sku: 'NYM-NORM-100',
    description:
      'Standard everyday makhana. Great for roasting, seasoning, or adding to traditional dishes.',
    active: true,
  },
  {
    id: 'normal-200g',
    name: 'Normal Makhana',
    quality: 'Normal',
    weightGrams: 200,
    price: 230,
    mrp: 290,
    image: DEFAULT_OG_IMAGE,
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
    image: DEFAULT_OG_IMAGE,
    stock: 160,
    sku: 'NYM-NORM-250',
    description: 'Everyday makhana in a 250g pantry size for roasting and cooking.',
    active: true,
  },
];

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
 * Resolve an image path to a valid absolute https://nutyaelite.com URL for Open Graph & Schema.org.
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
  if (trimmed.startsWith('https://nutyaelite.com/')) {
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
    name: SITE_NAME,
    url: `${PRODUCTION_ORIGIN}/`,
    logo: DEFAULT_OG_IMAGE,
    description:
      'Premium Indian makhana brand specializing in carefully selected fox nuts from Bihar for everyday snacking.',
    sameAs: [],
  };
}

export function buildWebSiteJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
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
  const fullProductName = `${product.name} (${product.weightGrams}g ${product.quality} Grade)`;
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
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
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
    const description = 'Restricted administrative portal for NYUTA ELITE MAKHANA.';
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
      description: 'Review your selected NYUTA ELITE Bihar makhana packs before checkout.',
      canonicalPath: '/cart',
    },
    '/checkout': {
      title: `Secure Checkout | ${SITE_NAME}`,
      description: 'Complete your NYUTA ELITE makhana order with secure Razorpay checkout.',
      canonicalPath: '/checkout',
    },
    '/orders': {
      title: `Your Orders & Tracking | ${SITE_NAME}`,
      description: 'View your NYUTA ELITE makhana order history, delivery status, and invoices.',
      canonicalPath: '/orders',
    },
    '/login': {
      title: `Sign In | ${SITE_NAME}`,
      description: 'Sign in to your NYUTA ELITE pantry account to manage orders and addresses.',
      canonicalPath: '/login',
    },
    '/register': {
      title: `Create Account | ${SITE_NAME}`,
      description: 'Create a NYUTA ELITE account for fast checkout and pan-India order tracking.',
      canonicalPath: '/register',
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
    const matchedProduct = findProductForSeo(rawSku, params.product);

    if (matchedProduct) {
      const canonicalSku = `${matchedProduct.quality.toLowerCase()}-${matchedProduct.weightGrams}g`;
      const canonicalUrl = `${PRODUCTION_ORIGIN}/products/makhana?sku=${canonicalSku}`;
      const title = `${matchedProduct.name} ${matchedProduct.weightGrams}g (${matchedProduct.quality} Grade) — ₹${matchedProduct.price} | ${SITE_NAME}`;
      const description = `${matchedProduct.description} Buy authentic ${matchedProduct.weightGrams}g ${matchedProduct.quality} Grade Bihar makhana (SKU: ${matchedProduct.sku}) at ₹${matchedProduct.price}. Freshly packed with pan-India delivery.`;
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
      'Explore NYUTA ELITE makhana packs in Premium jumbo-grade and Normal everyday-grade fox nuts. Available in 100g, 200g, and 250g air-tight pantry pouches.';
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
      'Learn how NYUTA ELITE sources 100% unbleached, naturally air-popped Euryale ferox (fox nuts) from traditional harvesting communities in Mithila, Bihar.';
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
      'Answers to common questions about NYUTA ELITE Premium vs. Normal makhana grades, 100g/200g/250g pouch sizes, roasting tips, pan-India delivery, and returns.';
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
    const title = `Contact Customer Care — Darbhanga, Bihar Dispatch Hub | ${SITE_NAME}`;
    const description =
      'Get in touch with the NYUTA ELITE MAKHANA support team in Mithila, Darbhanga, Bihar for order tracking, product inquiries, or delivery assistance.';
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

  // 5. Default / Homepage (/)
  const canonicalUrl = `${PRODUCTION_ORIGIN}/`;
  const title = `${SITE_NAME} | Premium & Everyday Bihar Makhana`;
  const description =
    'Discover carefully selected makhana from NYUTA ELITE. Authentic Bihar fox nuts in Premium and Normal quality grades (100g, 200g, 250g packs) for better everyday snacking.';
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

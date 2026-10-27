// Cloudflare Pages Advanced Worker — SPA routing, API proxy, www→apex redirect,
// and EDGE-SIDE SEO INJECTION for Googlebot / crawlers.
//
// SEO INJECTION RATIONALE:
//   The React SPA sets <title>, <meta>, canonical, and JSON-LD client-side.
//   Googlebot DOES execute JS, but may index a pre-JS snapshot where every
//   product URL serves identical index.html (homepage content).
//   This worker detects product and key routes and injects route-specific
//   <title>, <meta name="description">, <link rel="canonical">, and
//   Product JSON-LD directly into the initial HTML response — before any JS runs.
//   The React app's AnalyticsAndSeoObserver will still run and update the DOM
//   normally for human users; the injected tags simply give crawlers an accurate
//   first-pass snapshot.

const ORIGIN = 'https://nyutaelite.com';
const BRAND  = 'NYUTA ELITE MAKHANA';
const SITE   = 'NYUTA ELITE MAKHANA';

// ─── Authoritative product catalog ────────────────────────────────────────────
// Keep in sync with src/data/product.ts
const PRODUCTS = {
  'premium-100g': {
    sku: 'NYM-PREM-100',
    name: 'NYUTAELITE Premium Makhana – 100g',
    quality: 'Premium',
    weight: 100,
    price: 160,
    stock: 150,
    description:
      'Handpicked jumbo-grade Bihar fox nuts, 100g Premium pack. Uniform size, crisp air-popped crunch, minimal shell residue. SKU: NYM-PREM-100.',
    image: '/images/products/premium-makhana-100g.png',
  },
  'premium-200g': {
    sku: 'NYM-PREM-200',
    name: 'NYUTAELITE Premium Makhana – 200g',
    quality: 'Premium',
    weight: 200,
    price: 310,
    stock: 120,
    description:
      'Selected jumbo Bihar fox nuts in a 200g family pack, perfect for daily mindful snacking. SKU: NYM-PREM-200.',
    image: '/images/products/premium-makhana-200g.png',
  },
  'premium-250g': {
    sku: 'NYM-PREM-250',
    name: 'NYUTAELITE Premium Makhana – 250g',
    quality: 'Premium',
    weight: 250,
    price: 380,
    stock: 100,
    description:
      'Highest-grade Bihar fox nuts in a generous 250g pantry pack. Exceptional uniform size and crisp crunch. SKU: NYM-PREM-250.',
    image: '/images/products/premium-makhana-250g.png',
  },
  'normal-100g': {
    sku: 'NYM-NORM-100',
    name: 'NYUTAELITE Makhana – 100g Everyday',
    quality: 'Normal',
    weight: 100,
    price: 120,
    stock: 200,
    description:
      'Everyday Bihar fox nuts for dry roasting, seasoning, and traditional cooking. Air-tight 100g pouch. SKU: NYM-NORM-100.',
    image: '/images/products/normal-makhana-100g.png',
  },
  'normal-200g': {
    sku: 'NYM-NORM-200',
    name: 'NYUTAELITE Makhana – 200g Everyday',
    quality: 'Normal',
    weight: 200,
    price: 230,
    stock: 180,
    description:
      'Everyday Bihar fox nuts in a 200g pantry pouch. Perfect for daily roasting and home-spiced snacks. SKU: NYM-NORM-200.',
    image: '/images/products/normal-makhana-200g.png',
  },
  'normal-250g': {
    sku: 'NYM-NORM-250',
    name: 'NYUTAELITE Makhana – 250g Everyday',
    quality: 'Normal',
    weight: 250,
    price: 280,
    stock: 160,
    description:
      'Everyday Bihar fox nuts in a 250g pantry size. Great value for regular home roasting and cooking. SKU: NYM-NORM-250.',
    image: '/images/products/normal-makhana-250g.png',
  },
};

// ─── Build Product JSON-LD ─────────────────────────────────────────────────────
function buildProductJsonLd(sku, p, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: [`${ORIGIN}${p.image}`],
    sku: p.sku,
    brand: { '@type': 'Brand', name: BRAND },
    category: `${p.quality} Grade Makhana`,
    weight: { '@type': 'QuantitativeValue', value: p.weight, unitCode: 'GRM' },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: p.price.toFixed(2),
      availability:
        p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND, url: `${ORIGIN}/` },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime:  { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 2,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        refundType: 'https://schema.org/FullRefund',
      },
    },
  };
}

// ─── Build Breadcrumb JSON-LD ──────────────────────────────────────────────────
function buildBreadcrumb(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, item: c.url,
    })),
  };
}

// ─── Resolve route-specific SEO metadata ──────────────────────────────────────
function resolveSeoForRequest(url) {
  const path   = url.pathname;
  const params = url.searchParams;

  // Product detail: /products/makhana?sku=<sku>
  if (path === '/products/makhana' || path.startsWith('/products/')) {
    const sku = params.get('sku') || path.replace('/products/', '');
    const p   = PRODUCTS[sku];
    if (p) {
      const canonicalUrl = `${ORIGIN}/products/makhana?sku=${encodeURIComponent(sku)}`;
      const title = `Buy ${p.name} Online | ${p.quality} Grade Bihar Fox Nuts | ${SITE}`;
      const desc  = `${p.description} Buy at ₹${p.price}. Freshly packed with pan-India delivery.`;
      const jsonLd = [
        buildBreadcrumb([
          { name: 'Home',               url: `${ORIGIN}/` },
          { name: 'Makhana Collection', url: `${ORIGIN}/products/makhana` },
          { name: `${p.name}`,          url: canonicalUrl },
        ]),
        buildProductJsonLd(sku, p, canonicalUrl),
      ];
      return { title, desc, canonical: canonicalUrl, ogType: 'product', ogImage: `${ORIGIN}${p.image}`, jsonLd };
    }
    // Collection page (no specific product)
    const canonicalUrl = `${ORIGIN}/products/makhana`;
    return {
      title: `Shop Premium & Normal Bihar Makhana Packs (100g–250g) | ${SITE}`,
      desc:  `Explore ${BRAND} makhana in Premium jumbo-grade and Normal everyday-grade fox nuts. 100g, 200g, 250g air-tight pantry pouches. Pan-India delivery.`,
      canonical: canonicalUrl, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`, jsonLd: [],
    };
  }

  // Categories / shop
  if (path === '/categories') {
    return {
      title: `All Makhana Packs | Shop Bihar Fox Nuts Online | ${SITE}`,
      desc:  `Browse all ${BRAND} makhana packs — Premium and Normal grades in 100g, 200g, and 250g. Free pan-India shipping.`,
      canonical: `${ORIGIN}/categories`, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`,
      jsonLd: [
        buildBreadcrumb([
          { name: 'Home',      url: `${ORIGIN}/` },
          { name: 'All Packs', url: `${ORIGIN}/categories` },
        ]),
      ],
    };
  }

  // About
  if (path === '/about') {
    return {
      title: `About Our Bihar Makhana Heritage & Quality | ${SITE}`,
      desc:  `Learn how ${BRAND} sources unbleached, naturally air-popped Euryale ferox from traditional harvesting communities in Mithila, Bihar.`,
      canonical: `${ORIGIN}/about`, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`,
      jsonLd: [
        buildBreadcrumb([
          { name: 'Home',  url: `${ORIGIN}/` },
          { name: 'About', url: `${ORIGIN}/about` },
        ]),
      ],
    };
  }

  // FAQ
  if (path === '/faq') {
    return {
      title: `FAQ — Makhana Grades, Pack Sizes & Shipping | ${SITE}`,
      desc:  `Answers on ${BRAND} Premium vs Normal grades, 100g–250g sizes, roasting tips, pan-India delivery, and returns.`,
      canonical: `${ORIGIN}/faq`, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`,
      jsonLd: [
        buildBreadcrumb([
          { name: 'Home', url: `${ORIGIN}/` },
          { name: 'FAQ',  url: `${ORIGIN}/faq` },
        ]),
      ],
    };
  }

  // Contact
  if (path === '/contact') {
    return {
      title: `Contact Customer Care | ${SITE}`,
      desc:  `Get in touch with ${BRAND} MAKHANA for order tracking, product enquiries, bulk orders, or delivery assistance.`,
      canonical: `${ORIGIN}/contact`, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`,
      jsonLd: [
        buildBreadcrumb([
          { name: 'Home',    url: `${ORIGIN}/` },
          { name: 'Contact', url: `${ORIGIN}/contact` },
        ]),
      ],
    };
  }

  // Buyer's Guide Article: /learn/how-to-choose-good-quality-makhana
  if (path === '/learn/how-to-choose-good-quality-makhana') {
    const canonicalUrl = `${ORIGIN}/learn/how-to-choose-good-quality-makhana`;
    const title = `How to Choose Good-Quality Makhana: Complete Buyer's Guide | ${SITE}`;
    const desc  = `Learn how to choose good-quality Bihar makhana. Understand Suta sizing (4 Suta vs 5+ Suta jumbo), unbleached vs bleached fox nuts, crispness checks, and storage tips.`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How to Choose Good-Quality Makhana: A Complete Buyer’s Guide',
      description: desc,
      image: [`${ORIGIN}/images/products/premium-makhana-100g.png`],
      datePublished: '2026-10-25T00:00:00+05:30',
      dateModified: '2026-10-25T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: BRAND,
        url: `${ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: BRAND,
        logo: {
          '@type': 'ImageObject',
          url: `${ORIGIN}/nyuta-elite-logo.png`,
        },
      },
    };
    const breadcrumbJsonLd = buildBreadcrumb([
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Learn', url: `${ORIGIN}/categories` },
      { name: 'How to Choose Good-Quality Makhana', url: canonicalUrl },
    ]);
    return {
      title,
      desc,
      canonical: canonicalUrl,
      ogType: 'article',
      ogImage: `${ORIGIN}/images/products/premium-makhana-100g.png`,
      jsonLd: [articleJsonLd, breadcrumbJsonLd],
    };
  }

  // Educational Article 2: /learn/makhana-benefits-health
  if (path === '/learn/makhana-benefits-health') {
    const canonicalUrl = `${ORIGIN}/learn/makhana-benefits-health`;
    const title = `Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day | ${SITE}`;
    const desc  = `Discover 7 evidence-informed health benefits of makhana (fox nuts). Learn how Bihar Euryale ferox supports weight management, heart health, digestion, and bone strength.`;
    const articleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day',
      description: desc,
      image: [`${ORIGIN}/images/products/premium-makhana-100g.png`],
      datePublished: '2026-10-26T00:00:00+05:30',
      dateModified: '2026-10-26T00:00:00+05:30',
      mainEntityOfPage: canonicalUrl,
      author: {
        '@type': 'Organization',
        name: BRAND,
        url: `${ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: BRAND,
        logo: {
          '@type': 'ImageObject',
          url: `${ORIGIN}/nyuta-elite-logo.png`,
        },
      },
    };
    const breadcrumbJsonLd = buildBreadcrumb([
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Learn', url: `${ORIGIN}/categories` },
      { name: 'Makhana Benefits', url: canonicalUrl },
    ]);
    return {
      title,
      desc,
      canonical: canonicalUrl,
      ogType: 'article',
      ogImage: `${ORIGIN}/images/products/premium-makhana-100g.png`,
      jsonLd: [articleJsonLd, breadcrumbJsonLd],
    };
  }

  // Bulk order
  if (path === '/bulk-order/qualities') {
    return {
      title: `Bulk Makhana Orders | Wholesale Fox Nuts India | ${SITE}`,
      desc:  `Order ${BRAND} makhana in bulk — Grade 4, 5, 5.5, and 6 Sutta wholesale packs for retailers, restaurants, and manufacturers.`,
      canonical: `${ORIGIN}/bulk-order/qualities`, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`, jsonLd: [],
    };
  }

  // Default / homepage
  return {
    title: 'NYUTA ELITE MAKHANA | Premium Makhana & Fox Nuts',
    desc:  'Discover NYUTA ELITE MAKHANA and explore our range of makhana (fox nuts). Find product details, pack sizes, quality information, and ordering options.',
    canonical: `${ORIGIN}/`, ogType: 'website',
    ogImage: `${ORIGIN}/nyuta-elite-logo.png`, jsonLd: [],
  };
}

// ─── Escape HTML for safe injection ───────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Inject SEO tags into the initial HTML <head> ─────────────────────────────
// Replaces ONLY the static homepage placeholders (title, description, canonical,
// og tags) and appends Product JSON-LD. The React app will continue to update
// the DOM client-side normally.
function injectSeo(html, seo) {
  // Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${esc(seo.title)}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${esc(seo.desc)}"`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${esc(seo.canonical)}"`
  );

  // Replace og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${esc(seo.title)}"`
  );

  // Replace og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${esc(seo.desc)}"`
  );

  // Replace og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${esc(seo.canonical)}"`
  );

  // Replace og:type
  html = html.replace(
    /<meta property="og:type" content="[^"]*"/,
    `<meta property="og:type" content="${esc(seo.ogType)}"`
  );

  // Replace og:image
  html = html.replace(
    /<meta property="og:image" content="[^"]*"/,
    `<meta property="og:image" content="${esc(seo.ogImage)}"`
  );

  // Replace twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${esc(seo.title)}"`
  );

  // Replace twitter:description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${esc(seo.desc)}"`
  );

  // Replace twitter:image
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"/,
    `<meta name="twitter:image" content="${esc(seo.ogImage)}"`
  );

  // Inject product JSON-LD blocks just before </head>
  if (seo.jsonLd && seo.jsonLd.length > 0) {
    const jsonLdScripts = seo.jsonLd
      .map(
        (obj) =>
          `<script type="application/ld+json" data-edge-injected="true">${JSON.stringify(obj)}</script>`
      )
      .join('\n    ');
    html = html.replace('</head>', `  ${jsonLdScripts}\n  </head>`);
  }

  return html;
}

// ─── Should we inject SEO for this request? ───────────────────────────────────
// Only inject for HTML navigation requests (not assets, not API, not bots fetching feeds).
function shouldInjectSeo(url, request) {
  const path = url.pathname;
  // Skip asset requests
  if (path.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|xml|txt|json|map)$/i)) return false;
  // Skip API proxy
  if (path.startsWith('/api/')) return false;
  // Skip admin (noindex anyway)
  if (path.startsWith('/admin')) return false;
  // Skip private routes (noindex anyway — still inject for completeness)
  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) return false;
  return true;
}

// ─── Main fetch handler ────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Redirect www → apex (301 permanent)
    if (url.hostname === 'www.nyutaelite.com') {
      const apexUrl = new URL(request.url);
      apexUrl.hostname = 'nyutaelite.com';
      return Response.redirect(apexUrl.toString(), 301);
    }

    // 2. Proxy /api/* requests to the existing production API
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      const targetUrl = new URL(`https://api.nutyaelite.com${url.pathname}${url.search}`);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': url.origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              request.headers.get('Access-Control-Request-Headers') ||
              'Content-Type, Authorization, x-request-id',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set('Origin', 'https://nutyaelite.com');
      proxyHeaders.set('Host', 'api.nutyaelite.com');

      try {
        const response = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: proxyHeaders,
          body:
            request.method !== 'GET' && request.method !== 'HEAD'
              ? request.body
              : undefined,
          redirect: 'follow',
        });

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', url.origin);
        responseHeaders.set('Access-Control-Allow-Credentials', 'true');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Unable to reach API gateway',
            error: { code: 'GATEWAY_ERROR' },
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': url.origin,
              'Access-Control-Allow-Credentials': 'true',
            },
          }
        );
      }
    }

    // 3. Serve static assets and handle SPA client-side routing fallback
    let res = await env.ASSETS.fetch(request);
    if (
      res.status === 404 &&
      request.method === 'GET' &&
      !url.pathname.split('/').pop()?.includes('.')
    ) {
      res = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }

    // 4. Edge-side SEO injection for HTML navigation requests
    if (
      res.status === 200 &&
      res.headers.get('Content-Type')?.includes('text/html') &&
      shouldInjectSeo(url, request)
    ) {
      try {
        const seo  = resolveSeoForRequest(url);
        const html = await res.text();
        // Only inject if we can identify the SPA shell (presence of id="root")
        if (html.includes('id="root"')) {
          const injected = injectSeo(html, seo);
          const newHeaders = new Headers(res.headers);
          // Remove Content-Length since the body size has changed
          newHeaders.delete('Content-Length');
          return new Response(injected, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders,
          });
        }
      } catch {
        // If anything goes wrong, fall back to the original response
        // Re-fetch since we consumed the body above
        res = await env.ASSETS.fetch(request);
      }
    }

    return res;
  },
};

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
    name: `NYUTA ELITE Makhana – ${p.quality} ${p.weight}g`,
    description: p.description,
    image: [`${ORIGIN}${p.image}`],
    sku: p.sku,
    brand: { '@type': 'Brand', name: 'NYUTA ELITE MAKHANA' },
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
      seller: { '@type': 'Organization', name: 'NYUTA ELITE MAKHANA', url: `${ORIGIN}/` },
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
      const title = `NYUTA ELITE Makhana – ${p.quality} ${p.weight}g | Buy Online`;
      const desc  = `Shop NYUTA ELITE ${p.quality} Makhana (${p.weight}g). Handpicked Bihar fox nuts at ₹${p.price}. Freshly packed in airtight pouches with pan-India shipping.`;
      const jsonLd = [
        buildBreadcrumb([
          { name: 'Home',               url: `${ORIGIN}/` },
          { name: 'Shop Makhana',       url: `${ORIGIN}/categories` },
          { name: `NYUTA ELITE Makhana – ${p.quality} ${p.weight}g`, url: canonicalUrl },
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
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`,
      jsonLd: [
        buildBreadcrumb([
          { name: 'Home',         url: `${ORIGIN}/` },
          { name: 'Shop Makhana', url: canonicalUrl },
        ]),
      ],
    };
  }

  // Categories / shop
  if (path === '/categories') {
    const typeParam = params.get('type')?.toLowerCase();
    if (typeParam === 'premium') {
      const canonicalUrl = `${ORIGIN}/categories?type=Premium`;
      return {
        title: `Buy Premium Jumbo Makhana Online (100g, 200g, 250g) | ${SITE}`,
        desc: `Shop NYUTA ELITE Premium Grade Bihar Makhana. Handpicked jumbo-sized fox nuts with crisp crunch in 100g, 200g, and 250g pouches. Free pan-India delivery.`,
        canonical: canonicalUrl,
        ogType: 'website',
        ogImage: `${ORIGIN}/images/products/premium-makhana-100g.png`,
        jsonLd: [
          buildBreadcrumb([
            { name: 'Home', url: `${ORIGIN}/` },
            { name: 'Shop All Makhana', url: `${ORIGIN}/categories` },
            { name: 'Premium Makhana', url: canonicalUrl },
          ]),
        ],
      };
    }
    if (typeParam === 'normal') {
      const canonicalUrl = `${ORIGIN}/categories?type=Normal`;
      return {
        title: `Normal Everyday Makhana Packs (100g, 200g, 250g) | ${SITE}`,
        desc: `Shop NYUTA ELITE Normal Grade Bihar Makhana. Wholesome everyday fox nuts perfect for daily roasting, snacks, and cooking in 100g, 200g, and 250g pouches.`,
        canonical: canonicalUrl,
        ogType: 'website',
        ogImage: `${ORIGIN}/images/products/normal-makhana-100g.png`,
        jsonLd: [
          buildBreadcrumb([
            { name: 'Home', url: `${ORIGIN}/` },
            { name: 'Shop All Makhana', url: `${ORIGIN}/categories` },
            { name: 'Normal Makhana', url: canonicalUrl },
          ]),
        ],
      };
    }
    return {
      title: `All Makhana Packs | Shop Bihar Fox Nuts Online | ${SITE}`,
      desc:  `Browse all ${BRAND} makhana packs — Premium and Normal grades in 100g, 200g, and 250g. Free pan-India shipping.`,
      canonical: `${ORIGIN}/categories`, ogType: 'website',
      ogImage: `${ORIGIN}/nyuta-elite-logo.png`,
      jsonLd: [
        buildBreadcrumb([
          { name: 'Home',             url: `${ORIGIN}/` },
          { name: 'Shop All Makhana', url: `${ORIGIN}/categories` },
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
      jsonLd: [],
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
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is makhana (fox nuts)?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Makhana (also known as fox nuts, gorgon nuts, or puffed lotus seeds) is a natural plant-based food harvested from Euryale ferox water plants. Naturally light and crisp, it provides plant protein, dietary fiber, and essential minerals.',
              },
            },
            {
              '@type': 'Question',
              name: 'What is the difference between Premium and Normal Quality?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Premium Quality is selected for larger nut size (jumbo expansion), uniform round kernels, and minimal shell residue. Normal Quality is our everyday grade with slightly varied nut sizes, ideal for daily cooking and roasting.',
              },
            },
            {
              '@type': 'Question',
              name: 'What pack sizes are available?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Both grades are offered in 100g, 200g, and 250g pouches, sealed in air-tight packaging to preserve crispness.',
              },
            },
            {
              '@type': 'Question',
              name: 'How long does delivery take?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Orders are dispatched within 1–2 business days. Courier transit takes 5–7 business days to most serviceable Indian PIN codes.',
              },
            },
          ],
        },
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
      jsonLd: [],
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
        name: 'NYUTA ELITE MAKHANA',
        url: `${ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${ORIGIN}/nyuta-elite-logo.png`,
        },
      },
    };
    const breadcrumbJsonLd = buildBreadcrumb([
      { name: 'Home', url: `${ORIGIN}/` },
      { name: "Buyer's Guide", url: `${ORIGIN}/categories` },
      { name: 'How to Choose Good-Quality Makhana', url: canonicalUrl },
    ]);
    return {
      title,
      desc,
      canonical: canonicalUrl,
      ogType: 'article',
      ogImage: `${ORIGIN}/images/products/premium-makhana-100g.png`,
      jsonLd: [breadcrumbJsonLd, articleJsonLd],
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
        name: 'NYUTA ELITE MAKHANA',
        url: `${ORIGIN}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NYUTA ELITE MAKHANA',
        logo: {
          '@type': 'ImageObject',
          url: `${ORIGIN}/nyuta-elite-logo.png`,
        },
      },
    };
    const breadcrumbJsonLd = buildBreadcrumb([
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Nutrition Guide', url: `${ORIGIN}/categories` },
      { name: 'Makhana Benefits', url: canonicalUrl },
    ]);
    return {
      title,
      desc,
      canonical: canonicalUrl,
      ogType: 'article',
      ogImage: `${ORIGIN}/images/products/premium-makhana-100g.png`,
      jsonLd: [breadcrumbJsonLd, articleJsonLd],
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
    title: 'NYUTAELITE | NYUTA ELITE MAKHANA – Premium Fox Nuts',
    desc:  'Shop NYUTA ELITE MAKHANA, premium fox nuts from Bihar. Explore available makhana packs in different sizes and grades for everyday snacking.',
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

// ─── Render Route-Specific Body for Search Crawlers & Pre-JS Rendering ─────────
function renderRouteBody(url, seo) {
  const path = url.pathname;
  const params = url.searchParams;

  const headerHtml = `
      <header class="bg-[#123B2A] text-white py-4 px-6 border-b border-[#092218]">
        <div class="max-w-[1280px] mx-auto flex items-center justify-between">
          <a href="/" class="flex items-center gap-3">
            <img src="/nyuta-elite-logo.png" alt="NYUTA ELITE MAKHANA logo" class="w-10 h-10 rounded-full border border-[#C6A15B] object-cover" width="40" height="40" />
            <span class="font-serif text-xl font-bold tracking-wider text-white">NYUTA ELITE MAKHANA</span>
          </a>
          <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#D5DED6]">
            <a href="/" class="text-white hover:text-[#C6A15B]">Home</a>
            <a href="/categories" class="hover:text-white">Shop Makhana</a>
            <a href="/categories?type=Premium" class="hover:text-white">Premium Quality</a>
            <a href="/categories?type=Normal" class="hover:text-white">Normal Quality</a>
            <a href="/about" class="hover:text-white">About Us</a>
            <a href="/contact" class="hover:text-white">Contact</a>
            <a href="/faq" class="hover:text-white">FAQ</a>
          </nav>
        </div>
      </header>`;

  const footerHtml = `
      <footer class="bg-[#123B2A] text-white py-10 px-6">
        <div class="max-w-[1280px] mx-auto flex flex-wrap justify-between gap-6 text-xs text-[#D5DED6]">
          <p>© 2026 NYUTA ELITE MAKHANA. All rights reserved.</p>
          <div class="flex flex-wrap gap-4">
            <a href="/about" class="hover:text-white">About Us</a>
            <a href="/contact" class="hover:text-white">Contact</a>
            <a href="/faq" class="hover:text-white">FAQ</a>
            <a href="/categories" class="hover:text-white">All Packs</a>
            <a href="/learn/how-to-choose-good-quality-makhana" class="hover:text-white">Buyer's Guide</a>
            <a href="/learn/makhana-benefits-health" class="hover:text-white">Makhana Benefits</a>
          </div>
        </div>
      </footer>`;

  // 1. Product detail page
  if (path === '/products/makhana' || path.startsWith('/products/')) {
    const sku = params.get('sku') || path.replace('/products/', '');
    const p = PRODUCTS[sku];
    if (p) {
      const otherSkus = Object.keys(PRODUCTS).filter((k) => k !== sku);
      return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[1100px] mx-auto space-y-8">
        <nav aria-label="Breadcrumb" class="text-xs text-[#68756E] flex items-center gap-2">
          <a href="/" class="hover:underline">Home</a> &gt;
          <a href="/categories" class="hover:underline">Makhana Collection</a> &gt;
          <span class="text-[#123B2A] font-semibold">${esc(p.name)}</span>
        </nav>
        <div class="grid md:grid-cols-2 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-[#E8DECB] shadow-xs">
          <div class="aspect-square rounded-2xl bg-[#FAF7EF] border border-[#E8DECB] flex items-center justify-center p-6">
            <img src="${esc(p.image)}" alt="${esc(p.name)} — ${esc(p.quality)} Grade Bihar Fox Nuts (Makhana)" class="max-h-full object-contain" />
          </div>
          <div class="space-y-4">
            <span class="text-xs font-bold uppercase tracking-widest text-[#C6A15B]">${esc(p.quality)} Quality Grade</span>
            <h1 class="font-serif text-2xl sm:text-4xl font-bold text-[#092218]">${esc(p.name)}</h1>
            <p class="text-2xl font-extrabold text-[#123B2A]">₹${p.price} <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ml-2">In Stock</span></p>
            <p class="text-sm text-[#68756E] leading-relaxed">${esc(p.description)}</p>
            <div class="pt-4 border-t border-[#E8DECB] space-y-2 text-xs text-[#1C1C1C]">
              <p><strong>Net Weight:</strong> ${p.weight}g</p>
              <p><strong>Grade:</strong> ${esc(p.quality)} Quality Hand-Sorted Fox Nuts</p>
              <p><strong>Origin:</strong> Mithila Wetland Region, Bihar, India</p>
              <p><strong>Packaging:</strong> Sealed food-grade barrier pouch for lasting crispness</p>
            </div>
            <div class="pt-4">
              <a href="/cart" class="bg-[#123B2A] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-block">Order Now</a>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <h2 class="font-serif text-xl font-bold text-[#092218]">Explore Other Pack Sizes</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            ${otherSkus
              .map((k) => {
                const op = PRODUCTS[k];
                return `<a href="/products/makhana?sku=${encodeURIComponent(k)}" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block">
                <p class="font-bold text-[#092218] truncate">${esc(op.name)}</p>
                <p class="text-[#123B2A] font-semibold mt-1">₹${op.price}</p>
              </a>`;
              })
              .join('')}
          </div>
        </div>
      </main>
      ${footerHtml}`;
    }
  }

  // 2. Categories page
  if (path === '/categories') {
    const typeParam = params.get('type')?.toLowerCase();
    const isPremium = typeParam === 'premium';
    const isNormal = typeParam === 'normal';

    const breadcrumbHtml = isPremium
      ? `<nav aria-label="Breadcrumb" class="text-xs text-[#68756E] flex items-center gap-2">
          <a href="/" class="hover:underline">Home</a> &gt;
          <a href="/categories" class="hover:underline">Shop All Makhana</a> &gt;
          <span class="text-[#123B2A] font-semibold">Premium Makhana</span>
        </nav>`
      : isNormal
      ? `<nav aria-label="Breadcrumb" class="text-xs text-[#68756E] flex items-center gap-2">
          <a href="/" class="hover:underline">Home</a> &gt;
          <a href="/categories" class="hover:underline">Shop All Makhana</a> &gt;
          <span class="text-[#123B2A] font-semibold">Normal Makhana</span>
        </nav>`
      : `<nav aria-label="Breadcrumb" class="text-xs text-[#68756E] flex items-center gap-2">
          <a href="/" class="hover:underline">Home</a> &gt;
          <span class="text-[#123B2A] font-semibold">All Makhana Packs</span>
        </nav>`;

    const headingTitle = isPremium
      ? 'Buy Premium Jumbo Makhana Online'
      : isNormal
      ? 'Buy Normal Everyday Makhana Online'
      : 'Shop NYUTA ELITE Makhana';

    const headingDesc = isPremium
      ? 'Handpicked jumbo-grade Bihar fox nuts with uniform size, pristine crisp crunch, and minimal shell residue. Available in 100g, 200g, and 250g pouches.'
      : isNormal
      ? 'Wholesome, naturally popped everyday Bihar fox nuts. Perfect for daily roasting, home spicing, and cooking in 100g, 200g, and 250g pouches.'
      : 'Browse our complete collection of Bihar fox nuts. Available in Premium Jumbo and Normal Everyday grades across 100g, 200g, and 250g air-tight pouches.';

    const displayedKeys = Object.keys(PRODUCTS).filter((k) => {
      if (isPremium) return PRODUCTS[k].quality === 'Premium';
      if (isNormal) return PRODUCTS[k].quality === 'Normal';
      return true;
    });

    return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[1280px] mx-auto space-y-8">
        ${breadcrumbHtml}
        <div class="space-y-2">
          <h1 class="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">${headingTitle}</h1>
          <p class="text-sm text-[#68756E] max-w-2xl">${headingDesc}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${displayedKeys
            .map((k) => {
              const p = PRODUCTS[k];
              return `<article class="bg-white p-6 rounded-2xl border border-[#E8DECB] shadow-xs space-y-3">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#C6A15B]">${esc(p.quality)} Grade</span>
              <h2 class="font-serif text-lg font-bold text-[#092218]">${esc(p.name)}</h2>
              <p class="text-xs text-[#68756E]">${esc(p.description)}</p>
              <div class="flex items-center justify-between pt-2">
                <span class="text-lg font-extrabold text-[#123B2A]">₹${p.price}</span>
                <a href="/products/makhana?sku=${encodeURIComponent(k)}" class="bg-[#123B2A] text-white text-xs font-bold uppercase px-4 py-2 rounded-lg">View Pack</a>
              </div>
            </article>`;
            })
            .join('')}
        </div>
        <section class="bg-[#F7F1E5] rounded-2xl p-6 border border-[#E8DECB] space-y-4">
          <h2 class="font-serif text-lg font-bold text-[#092218]">Helpful Makhana Resources</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/learn/how-to-choose-good-quality-makhana" class="bg-white p-4 rounded-xl border border-[#E8DECB] block space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B]">Buyer's Guide</span>
              <p class="font-serif font-bold text-sm text-[#092218]">How to Choose Good-Quality Makhana</p>
              <p class="text-xs text-[#68756E]">Suta sizing, unbleached sourcing, crispness checks, and storage tips.</p>
            </a>
            <a href="/learn/makhana-benefits-health" class="bg-white p-4 rounded-xl border border-[#E8DECB] block space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B]">Nutrition &amp; Lifestyle</span>
              <p class="font-serif font-bold text-sm text-[#092218]">Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day</p>
              <p class="text-xs text-[#68756E]">Evidence-informed look at protein, fiber, magnesium, and heart health.</p>
            </a>
          </div>
          <div class="pt-1 flex flex-wrap gap-3 text-xs">
            <a href="/faq" class="text-[#123B2A] font-bold">FAQ — Delivery, Grades &amp; Returns</a>
            <a href="/bulk-order/qualities" class="text-[#123B2A] font-bold">Bulk / Wholesale Orders</a>
            <a href="/about" class="text-[#123B2A] font-bold">About NYUTA ELITE MAKHANA</a>
          </div>
        </section>
      </main>
      ${footerHtml}`;
  }

  // 3. About page
  if (path === '/about') {
    return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[960px] mx-auto space-y-6">
        <h1 class="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">About NYUTA ELITE MAKHANA</h1>
        <p class="text-base text-[#68756E] leading-relaxed">
          NYUTA ELITE MAKHANA is an Indian brand dedicated to delivering pure, unadulterated fox nuts from the freshwater wetlands of Bihar. We partner with traditional harvesting communities in Mithila, where Euryale ferox seeds are carefully collected, cleaned, hand-roasted, and popped with traditional expertise.
        </p>
        <p class="text-base text-[#68756E] leading-relaxed">
          Every pack is machine-screened and hand-graded for nut diameter, puffing density, and purity before being sealed into moisture-barrier pouches. We offer both Premium Jumbo-grade and Normal Everyday-grade fox nuts in 100g, 200g, and 250g packs.
        </p>
        <div class="pt-4">
          <a href="/categories" class="bg-[#123B2A] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider inline-block">Explore Our Pantry</a>
        </div>
      </main>
      ${footerHtml}`;
  }

  // 4. Contact page
  if (path === '/contact') {
    return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[960px] mx-auto space-y-6">
        <h1 class="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">Contact Customer Care</h1>
        <p class="text-base text-[#68756E] leading-relaxed">
          We are here to help with your orders, bulk purchase enquiries, delivery tracking, and questions about our makhana harvest.
        </p>
        <div class="grid md:grid-cols-2 gap-6 pt-4">
          <div class="bg-white p-6 rounded-2xl border border-[#E8DECB] space-y-2">
            <h2 class="font-serif text-lg font-bold text-[#092218]">Email Assistance</h2>
            <p class="text-sm text-[#68756E]">Send enquiries anytime to <a href="mailto:info@nyutaelite.com" class="font-semibold text-[#123B2A] underline">info@nyutaelite.com</a></p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-[#E8DECB] space-y-2">
            <h2 class="font-serif text-lg font-bold text-[#092218]">Phone &amp; WhatsApp</h2>
            <p class="text-sm text-[#68756E]">Support helpline: <a href="tel:+918102875852" class="font-semibold text-[#123B2A] underline">+91 81028 75852</a></p>
          </div>
        </div>
      </main>
      ${footerHtml}`;
  }

  // 5. FAQ page
  if (path === '/faq') {
    return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[960px] mx-auto space-y-6">
        <h1 class="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">Frequently Asked Questions</h1>
        <div class="space-y-4 pt-4">
          <div class="bg-white p-6 rounded-2xl border border-[#E8DECB] space-y-2">
            <h2 class="font-serif text-base font-bold text-[#092218]">What is makhana (fox nuts)?</h2>
            <p class="text-xs sm:text-sm text-[#68756E] leading-relaxed">Makhana is a natural plant-based food harvested from Euryale ferox water plants. Naturally light and crisp, it provides plant protein, dietary fiber, and essential minerals.</p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-[#E8DECB] space-y-2">
            <h2 class="font-serif text-base font-bold text-[#092218]">What is the difference between Premium and Normal Quality?</h2>
            <p class="text-xs sm:text-sm text-[#68756E] leading-relaxed">Premium Quality is selected for larger nut size (jumbo expansion), uniform round kernels, and minimal shell residue. Normal Quality is our everyday grade with slightly varied nut sizes, ideal for daily cooking and roasting.</p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-[#E8DECB] space-y-2">
            <h2 class="font-serif text-base font-bold text-[#092218]">What pack sizes are available?</h2>
            <p class="text-xs sm:text-sm text-[#68756E] leading-relaxed">Both grades are offered in 100g, 200g, and 250g pouches, sealed in air-tight packaging to preserve crispness.</p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-[#E8DECB] space-y-2">
            <h2 class="font-serif text-base font-bold text-[#092218]">How long does delivery take?</h2>
            <p class="text-xs sm:text-sm text-[#68756E] leading-relaxed">Orders are dispatched within 1–2 business days. Courier transit takes 5–7 business days to most serviceable Indian PIN codes.</p>
          </div>
        </div>
      </main>
      ${footerHtml}`;
  }

  // 6. Educational Guide 1: /learn/how-to-choose-good-quality-makhana
  if (path === '/learn/how-to-choose-good-quality-makhana') {
    return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[960px] mx-auto space-y-6">
        <nav aria-label="Breadcrumb" class="text-xs text-[#68756E] flex items-center gap-2">
          <a href="/" class="hover:underline">Home</a> &gt;
          <a href="/categories" class="hover:underline">Buyer's Guide</a> &gt;
          <span class="text-[#123B2A] font-semibold">How to Choose Good-Quality Makhana</span>
        </nav>
        <article class="space-y-4">
          <h1 class="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">How to Choose Good-Quality Makhana: Complete Buyer's Guide</h1>
          <p class="text-base text-[#68756E] leading-relaxed">
            When buying makhana (fox nuts) online, assessing quality requires examining kernel sizing, shell purity, color, and packaging moisture protection. In the Indian market, grading is historically based on the Suta measurement system, where 5+ Suta kernels represent jumbo expansion.
          </p>
          <div class="pt-4 space-y-3">
            <a href="/categories?type=Premium" class="bg-[#123B2A] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider inline-block">Shop Premium Makhana</a>
            <a href="/categories?type=Normal" class="ml-3 border border-[#123B2A] text-[#123B2A] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider inline-block">Shop Normal Makhana</a>
          </div>
          <div class="pt-6 border-t border-[#E8DECB] space-y-3">
            <h2 class="font-serif text-xl font-bold text-[#092218]">Available Pack Sizes</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <a href="/products/makhana?sku=premium-100g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Premium 100g</p><p class="text-[#123B2A] font-semibold mt-1">₹160</p></a>
              <a href="/products/makhana?sku=premium-200g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Premium 200g</p><p class="text-[#123B2A] font-semibold mt-1">₹310</p></a>
              <a href="/products/makhana?sku=premium-250g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Premium 250g</p><p class="text-[#123B2A] font-semibold mt-1">₹380</p></a>
              <a href="/products/makhana?sku=normal-100g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Normal 100g</p><p class="text-[#123B2A] font-semibold mt-1">₹120</p></a>
              <a href="/products/makhana?sku=normal-200g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Normal 200g</p><p class="text-[#123B2A] font-semibold mt-1">₹230</p></a>
              <a href="/products/makhana?sku=normal-250g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Normal 250g</p><p class="text-[#123B2A] font-semibold mt-1">₹280</p></a>
            </div>
          </div>
          <div class="pt-4 border-t border-[#E8DECB]">
            <p class="text-xs text-[#68756E] mb-2">Related article:</p>
            <a href="/learn/makhana-benefits-health" class="text-xs font-bold text-[#123B2A] hover:underline">Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day →</a>
          </div>
        </article>
      </main>
      ${footerHtml}`;
  }

  // 7. Educational Guide 2: /learn/makhana-benefits-health
  if (path === '/learn/makhana-benefits-health') {
    return `
      ${headerHtml}
      <main class="py-12 px-6 max-w-[960px] mx-auto space-y-6">
        <nav aria-label="Breadcrumb" class="text-xs text-[#68756E] flex items-center gap-2">
          <a href="/" class="hover:underline">Home</a> &gt;
          <a href="/categories" class="hover:underline">Nutrition Guide</a> &gt;
          <span class="text-[#123B2A] font-semibold">Makhana Benefits</span>
        </nav>
        <article class="space-y-4">
          <h1 class="font-serif text-3xl sm:text-5xl font-bold text-[#092218]">Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day</h1>
          <p class="text-base text-[#68756E] leading-relaxed">
            Makhana (Euryale ferox) is a nutrient-dense, naturally gluten-free snack harvested from Bihar. Rich in plant-based protein, dietary fiber, magnesium, and potassium, fox nuts offer clean satiety with low calorie density.
          </p>
          <div class="pt-4 space-y-3">
            <a href="/categories?type=Premium" class="bg-[#123B2A] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider inline-block">Shop Premium Makhana</a>
            <a href="/categories?type=Normal" class="ml-3 border border-[#123B2A] text-[#123B2A] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider inline-block">Shop Normal Makhana</a>
          </div>
          <div class="pt-6 border-t border-[#E8DECB] space-y-3">
            <h2 class="font-serif text-xl font-bold text-[#092218]">Available Pack Sizes</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <a href="/products/makhana?sku=premium-100g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Premium 100g</p><p class="text-[#123B2A] font-semibold mt-1">₹160</p></a>
              <a href="/products/makhana?sku=premium-200g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Premium 200g</p><p class="text-[#123B2A] font-semibold mt-1">₹310</p></a>
              <a href="/products/makhana?sku=premium-250g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Premium 250g</p><p class="text-[#123B2A] font-semibold mt-1">₹380</p></a>
              <a href="/products/makhana?sku=normal-100g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Normal 100g</p><p class="text-[#123B2A] font-semibold mt-1">₹120</p></a>
              <a href="/products/makhana?sku=normal-200g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Normal 200g</p><p class="text-[#123B2A] font-semibold mt-1">₹230</p></a>
              <a href="/products/makhana?sku=normal-250g" class="bg-white p-3 rounded-xl border border-[#E8DECB] text-xs hover:border-[#123B2A] block"><p class="font-bold text-[#092218]">Normal 250g</p><p class="text-[#123B2A] font-semibold mt-1">₹280</p></a>
            </div>
          </div>
          <div class="pt-4 border-t border-[#E8DECB]">
            <p class="text-xs text-[#68756E] mb-2">Related article:</p>
            <a href="/learn/how-to-choose-good-quality-makhana" class="text-xs font-bold text-[#123B2A] hover:underline">How to Choose Good-Quality Makhana →</a>
          </div>
        </article>
      </main>
      ${footerHtml}`;
  }

  return null;
}

// ─── Inject SEO tags and pre-rendered body into HTML ──────────────────────────
function injectSeo(html, seo, url) {
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

  // Inject route-specific JSON-LD blocks just before </head>
  if (seo.jsonLd && seo.jsonLd.length > 0) {
    // Strip static index.html fallback JSON-LD on route-specific requests so they don't duplicate
    html = html.replace(/<script id="jsonld-organization"[\s\S]*?<\/script>\s*/, '');
    html = html.replace(/<script id="jsonld-website"[\s\S]*?<\/script>\s*/, '');
    html = html.replace(/<script id="jsonld-faq"[\s\S]*?<\/script>\s*/, '');

    const jsonLdScripts = seo.jsonLd
      .map(
        (obj) =>
          `<script type="application/ld+json" data-edge-injected="true">${JSON.stringify(obj)}</script>`
      )
      .join('\n    ');
    html = html.replace('</head>', `  ${jsonLdScripts}\n  </head>`);
  }

  // Inject route-specific body if not homepage
  if (url && url.pathname !== '/') {
    const routeBody = renderRouteBody(url, seo);
    if (routeBody) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">\n${routeBody}\n    </div>`);
    }
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

// ─── Authoritative noindex route set ─────────────────────────────────────────
const NOINDEX_PREFIXES = [
  '/admin', '/cart', '/checkout', '/orders',
  '/account', '/wishlist', '/login', '/register',
  '/bulk-order/enquiry', '/api/',
];
function isNoindexRoute(pathname) {
  return NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// ─── Security and SEO response headers ───────────────────────────────────────
// Applied to every HTML navigation response served from the edge.
function addSecurityHeaders(headers, options = {}) {
  const { noindex = false, canonical = null, isHtml = true } = options;

  if (isHtml) {
    // Prevent MIME-type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');
    // Deny framing (clickjacking protection)
    headers.set('X-Frame-Options', 'DENY');
    // Strict referrer — send origin only on same-origin; no referrer cross-origin
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Limit browser features not needed by this site
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(self)'
    );
    // Cache HTML for 60 s at edge, 0 s at browser (fresh navigation; 1-minute edge CDN window)
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');

    // Belt-and-suspenders: add X-Robots-Tag on private routes
    if (noindex) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }

    // Inject Link: canonical HTTP header on indexable routes where we know the canonical
    if (!noindex && canonical) {
      headers.set('Link', `<${canonical}>; rel="canonical"`);
    }
  } else {
    // Static assets: long-lived cache
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

// ─── Main fetch handler ────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Force HTTPS (301 permanent)
    if (url.protocol === 'http:') {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      return Response.redirect(httpsUrl.toString(), 301);
    }

    // 2. Redirect www → apex (301 permanent)
    if (url.hostname === 'www.nyutaelite.com') {
      const apexUrl = new URL(request.url);
      apexUrl.hostname = 'nyutaelite.com';
      return Response.redirect(apexUrl.toString(), 301);
    }

    // 3. Trailing slash normalization for non-root paths (e.g. /categories/ -> /categories)
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      const cleanPath = url.pathname.replace(/\/+$/, '');
      const redirectUrl = new URL(`${url.origin}${cleanPath}${url.search}`);
      return Response.redirect(redirectUrl.toString(), 301);
    }

    // 4. Policy direct route aliases (Edge 301 permanent redirects)
    const policyRedirects = {
      '/bulk-order': '/bulk-order/qualities',
      '/shipping': '/about#shipping',
      '/returns': '/about#refund',
      '/refund': '/about#refund',
      '/privacy': '/about#privacy',
      '/terms': '/about#terms',
      '/fssai': '/about#fssai',
      '/grievance': '/about#grievance',
      '/policies': '/about#shipping',
    };
    if (policyRedirects[url.pathname]) {
      return Response.redirect(`${url.origin}${policyRedirects[url.pathname]}`, 301);
    }

    // 5. Alternative product path redirection: /products/:sku -> /products/makhana?sku=:sku
    if (url.pathname.startsWith('/products/') && url.pathname !== '/products/makhana') {
      const rawSlug = url.pathname.replace('/products/', '').toLowerCase();
      if (PRODUCTS[rawSlug]) {
        return Response.redirect(`${url.origin}/products/makhana?sku=${encodeURIComponent(rawSlug)}`, 301);
      }
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

    const isHtmlResponse =
      res.status === 200 && res.headers.get('Content-Type')?.includes('text/html');
    const isStaticAsset = url.pathname.match(
      /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|xml|txt|json|map)$/i
    );
    const noindex = isNoindexRoute(url.pathname);
    const seo = !noindex && isHtmlResponse ? resolveSeoForRequest(url) : null;
    const canonicalForHeader = seo?.canonical ?? null;

    // 4. Edge-side SEO injection for HTML navigation requests
    if (isHtmlResponse && shouldInjectSeo(url, request)) {
      try {
        const seoData = seo ?? resolveSeoForRequest(url);
        const html    = await res.text();
        // Only inject if we can identify the SPA shell (presence of id="root")
        if (html.includes('id="root"')) {
          const injected   = injectSeo(html, seoData, url);
          const newHeaders = new Headers(res.headers);
          // Remove Content-Length since the body size has changed
          newHeaders.delete('Content-Length');
          addSecurityHeaders(newHeaders, {
            noindex,
            canonical: canonicalForHeader,
            isHtml: true,
          });
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

    // 5. Apply headers to all other responses (non-injected HTML + static assets)
    const finalHeaders = new Headers(res.headers);
    if (isHtmlResponse) {
      // Non-SPA or fallback HTML (e.g. a direct /index.html fetch)
      addSecurityHeaders(finalHeaders, { noindex, canonical: canonicalForHeader, isHtml: true });
    } else if (isStaticAsset) {
      addSecurityHeaders(finalHeaders, { isHtml: false });
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: finalHeaders,
    });
  },
};

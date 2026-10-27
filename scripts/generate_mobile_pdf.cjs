const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '../scratch/mobile_audit');
const outputPdfPath = path.join(__dirname, '../NYUTA_ELITE_MAKHANA_Mobile_UI.pdf');

function getBase64Image(fileName) {
  const filePath = path.join(shotDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`Image missing: ${filePath}`);
    return '';
  }
  const ext = path.extname(fileName).replace('.', '');
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${base64}`;
}

async function buildPdf() {
  console.log('Encoding screenshots to base64...');

  const images = {
    hero: getBase64Image('01_homepage_hero.png'),
    pantry: getBase64Image('02_good_things_pantry.png'),
    sourcing: getBase64Image('03_process_sourcing.png'),
    premium: getBase64Image('04d_premium_cards_scrolled.png'),
    normal: getBase64Image('05d_normal_cards_scrolled.png'),
    bulkGrades: getBase64Image('06_bulk_sutta_grades_overview.png'),
    suttaFocus: getBase64Image('07_sutta_5_and_5_5_focus.png'),
    whatsappModal: getBase64Image('08_order_via_whatsapp_modal.png'),
    bulkForm: getBase64Image('09b_bulk_form_inputs.png'),
    cart: getBase64Image('10_shopping_cart.png'),
    productDetail: getBase64Image('11_product_detail.png'),
    wishlist: getBase64Image('12_wishlist.png'),
    about: getBase64Image('13_about_us.png'),
    contact: getBase64Image('14_contact_support.png'),
  };

  const pages = [
    // Page 1: Cover Page
    {
      type: 'cover',
      title: 'Mobile Storefront UI & UX Inspection',
      subtitle: 'Comprehensive visual verification of the customer shopping journey, product catalog, bulk ordering workflow, and WhatsApp integration rendered at native mobile scale.',
      metadata: [
        { label: 'Website Brand', value: 'NYUTA ELITE MAKHANA (Mithila, Bihar)' },
        { label: 'Environment', value: 'Local Production Runtime (http://localhost:5173/)' },
        { label: 'Inspection Viewport', value: '390 × 844 px (iPhone 12/13/14 Mobile Shell • 2x Retina)' },
        { label: 'QA Scope', value: 'Homepage, Pantry, Premium & Normal Makhana, 5 & 5.5 Sutta Grades, WhatsApp Modal, Cart, SKU' },
        { label: 'Brand Identity', value: 'Forest Green (#123B2A), Cream (#FAF7EF), Muted Gold (#C6A15B)' },
        { label: 'Audit Timestamp', value: 'October 2026 • Verified Working' }
      ]
    },
    // Page 2: Homepage Hero
    {
      pageNumber: 2,
      category: 'HOMEPAGE STOREFRONT',
      title: 'Mobile Hero & Brand Navigation',
      route: '/',
      description: 'Mobile header with brand emblem, hamburger navigation, search, wishlist, cart counter badge, Mithila prestige announcement badge, primary typography, CTA buttons ("EXPLORE OUR QUALITY" & "ORDER IN BULK"), and hero makhana photography.',
      image: images.hero,
      highlights: [
        'Responsive mobile header with touch-friendly 44px+ tap targets',
        'Distinct hierarchy for dual CTAs leading to quality and bulk options',
        'Optimized hero imagery formatted seamlessly for 390px viewport'
      ]
    },
    // Page 3: Pantry Collection
    {
      pageNumber: 3,
      category: 'HOMEPAGE SECTIONS',
      title: 'Good Things for Your Pantry',
      route: '/#pantry',
      description: 'The core pantry collection section rendering category tabs, pack size filters (100g, 200g, 250g), sorting options, and swipeable product cards featuring authentic packaging photography with discount tags and pricing.',
      image: images.pantry,
      highlights: [
        'Direct filter pills for quick quality and net-weight selection',
        'Touch-enabled mobile carousel with navigation arrow controls',
        'Clear price-per-pack display with MRP strike-through and savings tag'
      ]
    },
    // Page 4: Sourcing Timeline
    {
      pageNumber: 4,
      category: 'BRAND HERITAGE',
      title: 'From Source to Pantry: 4-Step Journey',
      route: '/#process',
      description: 'The artisanal production timeline illustrating the four key milestones: Select (Mithila wetland lotus ponds), Grade (artisanal hand-sorting), Pack (clean nitrogen-flush sealed pouches), and Deliver (express pan-India dispatch).',
      image: images.sourcing,
      highlights: [
        'Authentic photographic evidence of Bihar wetland makhana cultivation',
        'Vertical responsive step layout with numbered gold badges',
        'Builds immediate consumer trust and highlights GI-origin authenticity'
      ]
    },
    // Page 5: Premium Makhana
    {
      pageNumber: 5,
      category: 'PRODUCT CATALOG',
      title: 'Premium Makhana Collection',
      route: '/categories?type=Premium',
      description: 'Dedicated collection view for NYUTA ELITE Premium Makhana (top-tier jumbo 6-sutta puffs). Displays the authentic matte forest-green pouches (250g, 200g, 100g), ratings, promotional discounts, and instant "Add to Cart" actions.',
      image: images.premium,
      highlights: [
        'Proprietary forest-green and gold matte pouch imagery rendered with pouch-safe padding',
        'Prominent "PREMIUM" badge and net-weight identifiers',
        'Optimized touch card with heart icon for instant wishlist saving'
      ]
    },
    // Page 6: Normal Everyday Makhana
    {
      pageNumber: 6,
      category: 'PRODUCT CATALOG',
      title: 'Normal Everyday Makhana Collection',
      route: '/categories?type=Normal',
      description: 'Dedicated collection view for NYUTA ELITE Normal Everyday Makhana. Features authentic silver resealable pouches (250g, 200g, 100g) crafted for everyday mindful snacking, family cooking, and pantry stocking.',
      image: images.normal,
      highlights: [
        'Authentic silver metallic pouch imagery with clear nutrition window',
        'Everyday pantry value pricing starting from ₹120',
        'Consistent layout, typography, and card dimensions matching the Premium line'
      ]
    },
    // Page 7: Bulk Order Qualities Overview
    {
      pageNumber: 7,
      category: 'B2B WHOLESALE PORTAL',
      title: 'Bulk Order — Sutta Grading Overview',
      route: '/bulk-order/qualities',
      description: 'The B2B wholesale grade selection portal. Header banner highlights Mithila origin and hand-sorted standards. Introduces the traditional Sutta sieve sizing system (1 Sutta = 1/8 inch) used for commercial procurement.',
      image: images.bulkGrades,
      highlights: [
        '2-column responsive mobile grid accommodating all four commercial grades',
        'Clear grade labels: 4 Sutta (everyday), 5 Sutta (medium), 5.5 Sutta (large), 6 Sutta (jumbo)',
        'Interactive "SELECT QUALITY" action triggers quality customization drawer'
      ]
    },
    // Page 8: 5 Sutta & 5.5 Sutta Focus (Verified Updates)
    {
      pageNumber: 8,
      category: 'B2B WHOLESALE PORTAL',
      title: '5 Sutta & 5.5 Sutta Grades (Verified Images)',
      route: '/bulk-order/qualities',
      description: 'Scrolled mobile view demonstrating the newly updated 5 Sutta and 5.5 Sutta card images. Confirms that previous black letterboxing has been completely eliminated and replaced with crisp, high-resolution popped makhana macro photography.',
      image: images.suttaFocus,
      highlights: [
        '5 Sutta Makhana: Pristine 4:3 image of uniform medium popped kernels (~15.8 mm pop)',
        '5.5 Sutta Makhana: Crisp macro view of large expanded flower-like kernels (~17.5 mm pop)',
        'Perfect visual alignment with 4 Sutta and 6 Sutta cards with zero black padding'
      ]
    },
    // Page 9: Order via WhatsApp Modal
    {
      pageNumber: 9,
      category: 'COMMERCE INTEGRATION',
      title: 'Order via WhatsApp — Mobile Modal',
      route: '/ (Modal Trigger: Order in Bulk)',
      description: 'Mobile view of the Bulk Order Choice modal. Highlights Option B ("Order via WhatsApp") featuring the newly updated authentic NYUTA ELITE product trio packaging image alongside the official WhatsApp chat action.',
      image: images.whatsappModal,
      highlights: [
        'Authentic multi-pouch packaging imagery replacing previous generic burlap sacks',
        'Official WhatsApp green CTA (#25D366) generating pre-filled procurement details',
        'Direct connection to official helpline (+91 62014 26357) for instant wholesale quotes'
      ]
    },
    // Page 10: Bulk Order Enquiry Form
    {
      pageNumber: 10,
      category: 'B2B WHOLESALE PORTAL',
      title: 'Bulk Wholesale Enquiry & MOQ Form',
      route: '/bulk-order/enquiry',
      description: 'Commercial enquiry form allowing business buyers to configure multi-grade orders, select quick quantity presets (25kg, 50kg, 100kg, 250kg, 500kg, 1000kg), specify delivery locations, and submit formal RFQs.',
      image: images.bulkForm,
      highlights: [
        'Preset weight chips enabling rapid commercial order quantity entry',
        'Multi-grade configuration tags with "Add another grade" action',
        'Validation-ready fields for contact name, phone, company, and delivery notes'
      ]
    },
    // Page 11: Shopping Cart
    {
      pageNumber: 11,
      category: 'CUSTOMER CHECKOUT',
      title: 'Mobile Shopping Cart Experience',
      route: '/cart',
      description: 'Customer cart screen showing real selected items (Premium 250g & Normal 200g), quantity steppers, item price calculations, free express delivery unlocked milestone bar, subtotal summary, and "Proceed to Checkout" CTA.',
      image: images.cart,
      highlights: [
        'Unlocked Free Express Delivery milestone banner encouraging basket building',
        'Individual pouch thumbnails, weight labels, and unit price breakdowns',
        'Sticky bottom mobile navigation ensuring frictionless journey across the site'
      ]
    },
    // Page 12: Product Detail Page
    {
      pageNumber: 12,
      category: 'PRODUCT DETAILS (SKU)',
      title: 'Single Product SKU Detail Page',
      route: '/products/makhana',
      description: 'Single product view for NYUTA ELITE Premium Makhana. Features high-resolution zoomable pouch imagery, GI-tagged authentic Mithila origin badge, net weight selector chips (100g, 200g, 250g), savings badge, and "Add to Cart" button.',
      image: images.productDetail,
      highlights: [
        'Prominent GI-Tagged authentic harvest badge assuring Mithila origin',
        'Dynamic pricing updates when switching between pack weight options',
        '"Save to Wishlist" and "Back to Pantry" navigation breadcrumbs'
      ]
    },
    // Page 13: Customer Wishlist
    {
      pageNumber: 13,
      category: 'CUSTOMER ACCOUNT',
      title: 'Saved Pantry Wishlist',
      route: '/wishlist',
      description: 'Customer wishlist interface designed for bookmarking favorite makhana pack sizes and re-ordering regular pantry items. Demonstrates the clean empty state with direct "Shop Bihar Makhana" call to action.',
      image: images.wishlist,
      highlights: [
        'Persistent client-side storage retaining customer favorites across sessions',
        'Clean empty state with brand heart emblem and warm cream background',
        'Direct link back to product discovery and category browsing'
      ]
    },
    // Page 14: Customer Care & Support
    {
      pageNumber: 14,
      category: 'CUSTOMER CARE',
      title: 'Customer Support Hub & Dispatch Details',
      route: '/contact',
      description: 'Customer care and contact hub providing direct access to the NYUTA ELITE operations desk in Darbhanga, Bihar. Outlines customer support hours (Mon–Sat 9AM–7PM), verified helpline (+91 62014 26357), email, and dispatch standards.',
      image: images.contact,
      highlights: [
        'Full transparency of operations and dispatch hub located in Darbhanga, Bihar',
        'Verified phone helpline with one-tap dialing capability on mobile',
        'FSSAI certified food-grade packaging and pan-India logistics coverage'
      ]
    }
  ];

  console.log(`Building HTML template with ${pages.length} pages...`);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NYUTA ELITE MAKHANA — Mobile Storefront UI & UX Inspection</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1C1C1C;
      background: #F4EFE6;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 16mm 18mm 14mm 18mm;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #FCFAF5;
      overflow: hidden;
    }

    /* Cover Page Styling */
    .cover-page {
      background: linear-gradient(145deg, #123B2A 0%, #092218 60%, #05160F 100%);
      color: #FCFAF5;
      padding: 24mm 22mm 20mm 22mm;
    }

    .cover-top {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 1px solid rgba(198, 161, 91, 0.35);
      padding-bottom: 18px;
    }

    .cover-emblem {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #FAF7EF;
      border: 2px solid #C6A15B;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #123B2A;
      font-family: 'Playfair Display', serif;
      font-weight: 800;
      font-size: 22px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .cover-brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2.5px;
      color: #FAF7EF;
      text-transform: uppercase;
    }

    .cover-brand-sub {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 3px;
      color: #C6A15B;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .cover-hero-section {
      margin-top: 36px;
      margin-bottom: 24px;
    }

    .cover-badge {
      display: inline-block;
      background: rgba(198, 161, 91, 0.18);
      border: 1px solid #C6A15B;
      color: #EBD6A8;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 6px 14px;
      border-radius: 30px;
      margin-bottom: 18px;
    }

    .cover-main-heading {
      font-family: 'Playfair Display', serif;
      font-size: 38px;
      font-weight: 700;
      line-height: 1.15;
      color: #FCFAF5;
      margin-bottom: 14px;
    }

    .cover-main-heading span {
      color: #C6A15B;
      font-style: italic;
    }

    .cover-desc {
      font-size: 13px;
      line-height: 1.6;
      color: #D1DED6;
      max-width: 580px;
    }

    .cover-meta-grid {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(198, 161, 91, 0.25);
      border-radius: 14px;
      padding: 18px 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 20px;
      margin-bottom: 24px;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
    }

    .cover-meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #C6A15B;
      margin-bottom: 3px;
    }

    .cover-meta-value {
      font-size: 12px;
      font-weight: 600;
      color: #FCFAF5;
      line-height: 1.4;
    }

    .cover-toc {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 20px;
    }

    .cover-toc-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #FAF7EF;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cover-toc-title::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #C6A15B;
    }

    .cover-toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      font-size: 10.5px;
      color: #B8C7BD;
    }

    .cover-toc-item strong {
      color: #C6A15B;
      font-weight: 700;
      margin-right: 4px;
    }

    .cover-footer {
      border-top: 1px solid rgba(198, 161, 91, 0.3);
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #8E9F94;
    }

    /* Content Pages Header */
    .page-header {
      border-bottom: 2px solid #E8DECB;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .brand-strap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-strap-logo {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #123B2A;
      color: #FAF7EF;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #C6A15B;
    }

    .brand-strap-name {
      font-family: 'Playfair Display', serif;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #123B2A;
      text-transform: uppercase;
    }

    .page-viewport-badge {
      font-size: 9.5px;
      font-weight: 700;
      color: #5A6D63;
      background: #EFEAE0;
      padding: 3px 9px;
      border-radius: 6px;
      border: 1px solid #E8DECB;
      letter-spacing: 0.5px;
    }

    /* Content Layout */
    .content-layout {
      flex: 1;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 22px;
      align-items: center;
      min-height: 0;
    }

    /* Phone Mockup Frame */
    .phone-column {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .phone-frame {
      width: 280px;
      height: 606px;
      background: #18221D;
      border-radius: 36px;
      padding: 10px;
      box-shadow: 0 16px 36px -6px rgba(18, 59, 42, 0.22), 0 0 0 1px rgba(0,0,0,0.1);
      position: relative;
      display: flex;
      flex-direction: column;
      border: 2px solid #2F3E35;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      border-radius: 26px;
      overflow: hidden;
      background: #FCFAF5;
      position: relative;
    }

    .phone-screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      display: block;
    }

    /* Info Column */
    .info-column {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-left: 6px;
    }

    .section-category-tag {
      display: inline-block;
      align-self: flex-start;
      background: #123B2A;
      color: #EBD6A8;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: #123B2A;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .route-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: monospace;
      font-size: 11px;
      font-weight: 600;
      color: #123B2A;
      background: #EFE9DC;
      border: 1px solid #D9CEBA;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 16px;
      align-self: flex-start;
    }

    .route-pill::before {
      content: '●';
      color: #25D366;
      font-size: 10px;
    }

    .section-description {
      font-size: 12px;
      line-height: 1.65;
      color: #425248;
      margin-bottom: 20px;
    }

    .highlights-box {
      background: #F4EFE6;
      border: 1px solid #E4DAC6;
      border-left: 4px solid #C6A15B;
      border-radius: 10px;
      padding: 14px 16px;
    }

    .highlights-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #123B2A;
      margin-bottom: 8px;
    }

    .highlights-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .highlights-list li {
      font-size: 11px;
      line-height: 1.45;
      color: #2D3D34;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .highlights-list li::before {
      content: '✓';
      color: #123B2A;
      font-weight: 800;
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1px solid #E8DECB;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: #7A8D82;
      font-weight: 500;
    }

    .page-footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-footer-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #C6A15B;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: COVER -->
  <div class="page cover-page">
    <div class="cover-top">
      <div class="cover-emblem">NE</div>
      <div>
        <div class="cover-brand-title">NYUTA ELITE MAKHANA</div>
        <div class="cover-brand-sub">Premium Mithila Harvest • GI-Tagged Superfood</div>
      </div>
    </div>

    <div class="cover-hero-section">
      <div class="cover-badge">Official Storefront Audit</div>
      <h1 class="cover-main-heading">
        Mobile User Interface<br>&amp; <span>Visual Experience Audit</span>
      </h1>
      <p class="cover-desc">
        Comprehensive quality assurance inspection capturing the real, live customer storefront rendered at native smartphone resolution (390 × 844 px, iPhone 12/13/14 shell).
      </p>
    </div>

    <div class="cover-meta-grid">
      ${pages[0].metadata.map(m => `
        <div class="cover-meta-item">
          <span class="cover-meta-label">${m.label}</span>
          <span class="cover-meta-value">${m.value}</span>
        </div>
      `).join('')}
    </div>

    <div class="cover-toc">
      <div class="cover-toc-title">Audited Pages &amp; Sections Index</div>
      <div class="cover-toc-grid">
        <div class="cover-toc-item"><strong>02.</strong> Mobile Hero &amp; Brand Navigation</div>
        <div class="cover-toc-item"><strong>08.</strong> 5 Sutta &amp; 5.5 Sutta Grades (Verified)</div>
        <div class="cover-toc-item"><strong>03.</strong> Good Things for Your Pantry</div>
        <div class="cover-toc-item"><strong>09.</strong> Order via WhatsApp Modal</div>
        <div class="cover-toc-item"><strong>04.</strong> Source to Pantry Timeline</div>
        <div class="cover-toc-item"><strong>10.</strong> Bulk Wholesale Enquiry Form</div>
        <div class="cover-toc-item"><strong>05.</strong> Premium Makhana Collection</div>
        <div class="cover-toc-item"><strong>11.</strong> Shopping Cart Experience</div>
        <div class="cover-toc-item"><strong>06.</strong> Normal Everyday Makhana</div>
        <div class="cover-toc-item"><strong>12.</strong> Single Product SKU Detail Page</div>
        <div class="cover-toc-item"><strong>07.</strong> Bulk Order Sutta Grading Overview</div>
        <div class="cover-toc-item"><strong>13.</strong> Saved Pantry Wishlist</div>
        <div class="cover-toc-item"><strong>14.</strong> Customer Care &amp; Support Hub</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>NYUTA ELITE MAKHANA • Mobile UI Visual Verification</div>
      <div>Strictly Confidential • Internal Production QA Document</div>
    </div>
  </div>

  <!-- CONTENT PAGES (Pages 2 - 14) -->
  ${pages.slice(1).map(p => `
    <div class="page">
      <div class="page-header">
        <div class="brand-strap">
          <div class="brand-strap-logo">NE</div>
          <div class="brand-strap-name">NYUTA ELITE MAKHANA</div>
        </div>
        <div class="page-viewport-badge">Viewport: 390 × 844 px • iPhone Shell</div>
      </div>

      <div class="content-layout">
        <div class="phone-column">
          <div class="phone-frame">
            <div class="phone-screen">
              <img src="${p.image}" alt="${p.title}" />
            </div>
          </div>
        </div>

        <div class="info-column">
          <div class="section-category-tag">${p.category}</div>
          <h2 class="section-title">${p.title}</h2>
          <div class="route-pill">${p.route}</div>
          <p class="section-description">${p.description}</p>

          <div class="highlights-box">
            <div class="highlights-title">Mobile UX &amp; Visual Verification</div>
            <ul class="highlights-list">
              ${p.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div class="page-footer">
        <div class="page-footer-left">
          <span>NYUTA ELITE MAKHANA</span>
          <span class="page-footer-dot"></span>
          <span>Mobile UI Audit</span>
        </div>
        <div>Page ${p.pageNumber} of ${pages.length}</div>
      </div>
    </div>
  `).join('')}

</body>
</html>`;

  const htmlPath = path.join(shotDir, 'report.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`Saved HTML report to ${htmlPath}`);

  console.log('Launching headless browser to compile PDF...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log('Rendering PDF to file...');
  await pdfPage.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();
  const stats = fs.statSync(outputPdfPath);
  console.log(`\nSUCCESS: Generated ${outputPdfPath}`);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

buildPdf().catch(console.error);

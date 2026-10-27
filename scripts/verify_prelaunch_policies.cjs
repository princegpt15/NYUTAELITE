// scripts/verify_prelaunch_policies.cjs
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shotDir = path.join(__dirname, '../scratch/prelaunch_verification');
if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

async function runAudit() {
  console.log('Starting Pre-Launch Policy & Compliance Audit...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let allPassed = true;

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('nyutaelite_analytics_consent', 'granted');
    });

    // TEST 1: Policy Hub - Sections & Consistency
    console.log('=== TEST 1: Policy Hub (/about) - Section Existence & Anchors ===');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle2' });

    const policySections = await page.evaluate(() => {
      const shipping = document.getElementById('shipping');
      const refund = document.getElementById('refund');
      const privacy = document.getElementById('privacy');
      const terms = document.getElementById('terms');
      const fssai = document.getElementById('fssai');
      const grievance = document.getElementById('grievance');
      const checklist = document.getElementById('checklist');

      return {
        hasShipping: !!shipping,
        hasRefund: !!refund,
        hasPrivacy: !!privacy,
        hasTerms: !!terms,
        hasFssai: !!fssai,
        hasGrievance: !!grievance,
        hasChecklist: !!checklist,
        shippingText: shipping ? shipping.innerText : '',
        refundText: refund ? refund.innerText : '',
        grievanceText: grievance ? grievance.innerText : '',
        checklistText: checklist ? checklist.innerText : '',
      };
    });

    console.log('Policy Sections Found:', {
      hasShipping: policySections.hasShipping,
      hasRefund: policySections.hasRefund,
      hasPrivacy: policySections.hasPrivacy,
      hasTerms: policySections.hasTerms,
      hasFssai: policySections.hasFssai,
      hasGrievance: policySections.hasGrievance,
      hasChecklist: policySections.hasChecklist,
    });

    // Content checks on Shipping
    const shippingOk =
      policySections.shippingText.includes('1–2 Business Days') &&
      policySections.shippingText.includes('5–7 Business Days') &&
      policySections.shippingText.includes('~6–9 Business Days') &&
      policySections.shippingText.includes('Estimates Only') &&
      policySections.shippingText.includes('₹40') &&
      policySections.shippingText.includes('₹499');

    console.log('Shipping Policy Content Verified:', shippingOk);
    if (!shippingOk) allPassed = false;

    // Content checks on Returns
    const refundOk =
      policySections.refundText.includes('Within 48 Hours') &&
      policySections.refundText.includes('Zero-Cost Reship') &&
      policySections.refundText.includes('Transit Damage') &&
      policySections.refundText.includes('Freshness Seals') &&
      policySections.refundText.includes('Statutory Consumer Safeguard') &&
      policySections.refundText.includes('info@nutyaelite.com') &&
      policySections.refundText.includes('+91 81028 75852');

    console.log('Returns & Refunds Policy Content Verified:', refundOk);
    if (!refundOk) allPassed = false;

    // Content checks on Grievance
    const grievanceOk =
      policySections.grievanceText.includes('Raushan Kumar') &&
      policySections.grievanceText.includes('info@nutyaelite.com') &&
      policySections.grievanceText.includes('Bhojpur') &&
      policySections.grievanceText.includes('802301') &&
      policySections.grievanceText.includes('Pending Ratification') &&
      policySections.grievanceText.includes('48 hours') &&
      policySections.grievanceText.includes('30 days');

    console.log('Grievance Redressal Mechanism Verified:', grievanceOk);
    if (!grievanceOk) allPassed = false;

    // Content checks on Checklist
    const checklistOk =
      policySections.checklistText.includes('COMPLETED & VERIFIED') &&
      policySections.checklistText.includes('20426021000494') &&
      policySections.checklistText.includes('PROPOSED INTENT: 48 HOURS') &&
      policySections.checklistText.includes('PROPOSED: RAUSHAN KUMAR');

    console.log('Owner Confirmation Checklist Verified:', checklistOk);
    if (!checklistOk) allPassed = false;

    // Capture desktop screenshots of key sections
    const grievanceEl = await page.$('#grievance');
    if (grievanceEl) {
      await grievanceEl.screenshot({ path: path.join(shotDir, 'desktop_grievance_section.png') });
      console.log('Saved element screenshot: desktop_grievance_section.png');
    }

    // TEST 2: Policy Direct Route Aliases
    console.log('\n=== TEST 2: Policy Route Aliases & Redirects ===');
    const routesToTest = [
      { path: '/shipping', expectedHash: '#shipping' },
      { path: '/returns', expectedHash: '#refund' },
      { path: '/refund', expectedHash: '#refund' },
      { path: '/privacy', expectedHash: '#privacy' },
      { path: '/terms', expectedHash: '#terms' },
      { path: '/fssai', expectedHash: '#fssai' },
      { path: '/grievance', expectedHash: '#grievance' },
    ];

    for (const r of routesToTest) {
      await page.goto(`http://localhost:5173${r.path}`, { waitUntil: 'networkidle2' });
      const currentUrl = page.url();
      const matched = currentUrl.includes(r.expectedHash);
      console.log(`Route ${r.path} -> ${currentUrl} (Matches ${r.expectedHash}: ${matched})`);
      if (!matched) allPassed = false;
    }

    // TEST 3: Footer Policy Links
    console.log('\n=== TEST 3: Footer Policy Links ===');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    const footerLinks = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const links = Array.from(footer.querySelectorAll('a')).map((a) => ({
        text: a.innerText.trim(),
        href: a.getAttribute('href'),
      }));
      return links;
    });

    const expectedFooterLinks = [
      '/about#privacy',
      '/about#terms',
      '/about#fssai',
      '/about#grievance',
      '/about#checklist',
      '/about#shipping',
      '/about#refund',
    ];

    for (const exp of expectedFooterLinks) {
      const found = footerLinks.some((l) => l.href === exp);
      console.log(`Footer link ${exp} present: ${found}`);
      if (!found) allPassed = false;
    }

    // TEST 4: Product Page Messaging
    console.log('\n=== TEST 4: Product Page (/products/makhana) Shipping & Return Notes ===');
    await page.goto('http://localhost:5173/products/makhana', { waitUntil: 'networkidle2' });
    const productText = await page.evaluate(() => document.body.innerText);

    const productChecks = {
      hasTimeline: productText.includes('1–2 business days') && productText.includes('5–7 business days') && productText.includes('~6–9 business days'),
      has48HourNotice: productText.includes('48 hours'),
      hasFssaiReg: productText.includes('20426021000494'),
      hasFreeShippingNote: productText.includes('₹40') && productText.includes('₹499+'),
      hasOfficialContact: productText.includes('info@nutyaelite.com') && productText.includes('+91 81028 75852'),
    };
    console.log('Product Page Checks:', productChecks);
    if (!Object.values(productChecks).every(Boolean)) allPassed = false;

    // TEST 5: FAQ Page Consistency
    console.log('\n=== TEST 5: FAQ (/faq) Shipping & Return Question Consistency ===');
    await page.goto('http://localhost:5173/faq', { waitUntil: 'networkidle2' });
    
    // Find and click Question 7 ("How long does delivery take?")
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const q7 = buttons.find((b) => b.innerText.includes('How long does delivery take?'));
      if (q7) q7.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const faq7Text = await page.evaluate(() => document.body.innerText);

    // Find and click Question 9 ("What is the return/refund policy?")
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const q9 = buttons.find((b) => b.innerText.includes('return/refund policy'));
      if (q9) q9.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const faq9Text = await page.evaluate(() => document.body.innerText);

    const faqChecks = {
      faqHasTimeline: faq7Text.includes('1–2 business days') && faq7Text.includes('5–7 business days') && faq7Text.includes('6–9 business days'),
      faqHas48Hours: faq9Text.includes('48 hours'),
      faqHasSupportContact: faq9Text.includes('info@nutyaelite.com') && faq9Text.includes('+91 81028 75852'),
    };
    console.log('FAQ Page Checks:', faqChecks);
    if (!Object.values(faqChecks).every(Boolean)) allPassed = false;

    // TEST 6: Checkout Messaging
    console.log('\n=== TEST 6: Checkout Page (/checkout) Messaging ===');
    await page.evaluate(() => {
      const mockCart = [
        {
          productId: 'premium-250g',
          productName: 'Premium Makhana',
          quality: 'Premium',
          weightGrams: 250,
          price: 349,
          mrp: 399,
          quantity: 1,
          image: '/nyuta-elite-logo.png',
        },
      ];
      localStorage.setItem('nyutaelite_cart', JSON.stringify(mockCart));
    });
    await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));
    const checkoutText = await page.evaluate(() => document.body.innerText);

    const checkoutChecks = {
      hasTimelineSummary: checkoutText.includes('1–2 business days') && checkoutText.includes('5–7 business days'),
      hasExpectedOverall: checkoutText.includes('~6–9 business days'),
      has48HourDamageNote: checkoutText.includes('48h'),
      hasFssaiReg: checkoutText.includes('20426021000494'),
      hasStandardFee: checkoutText.includes('₹40') || checkoutText.includes('FREE'),
    };
    console.log('Checkout Page Checks:', checkoutChecks);
    if (!Object.values(checkoutChecks).every(Boolean)) allPassed = false;

    // TEST 7: Contact Page Grievance Link
    console.log('\n=== TEST 7: Contact Page (/contact) Grievance Escalation Link ===');
    await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle2' });
    const contactText = await page.evaluate(() => document.body.innerText);

    const contactChecks = {
      hasGrievanceLink: contactText.includes('Statutory Grievance Redressal') && contactText.includes('Raushan Kumar'),
      hasOfficialEmails: contactText.includes('info@nutyaelite.com') && contactText.includes('enterprisesp0r@gmail.com'),
      hasOfficialPhone: contactText.includes('+91 81028 75852'),
      hasRegisteredOffice: contactText.includes('Krishna Vihar Lock No. 11') && contactText.includes('Bhojpur'),
      hasFssaiReg: contactText.includes('20426021000494'),
    };
    console.log('Contact Page Checks:', contactChecks);
    if (!Object.values(contactChecks).every(Boolean)) allPassed = false;

    // TEST 8: Mobile Responsiveness Viewport (390x844)
    console.log('\n=== TEST 8: Mobile Responsive Audit (390x844) ===');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/about#grievance', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    const mobileGrievanceEl = await page.$('#grievance');
    if (mobileGrievanceEl) {
      await mobileGrievanceEl.screenshot({ path: path.join(shotDir, 'mobile_grievance_section.png') });
      console.log('Saved mobile screenshot: mobile_grievance_section.png');
    }

    await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(shotDir, 'mobile_checkout_page.png') });
    console.log('Saved mobile screenshot: mobile_checkout_page.png');

    console.log(`\n========================================`);
    console.log(`PRE-LAUNCH POLICY AUDIT: ${allPassed ? 'ALL PASS ✅' : 'FAIL ❌'}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Audit failed with error:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  process.exit(allPassed ? 0 : 1);
}

runAudit();

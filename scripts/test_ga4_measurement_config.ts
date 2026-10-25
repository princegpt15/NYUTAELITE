// scripts/test_ga4_measurement_config.ts
import {
  getMeasurementId,
  isValidMeasurementId,
  DEFAULT_PRODUCTION_MEASUREMENT_ID,
  toGA4Item,
  sanitizeAnalyticsParams,
  grantAnalyticsConsent,
  denyAnalyticsConsent,
  resetAnalyticsConsent,
  getAnalyticsConsent,
  hasTrackedPurchase,
  trackPurchase,
  clearLocalAnalyticsIdempotencyCache,
  clearRecordedAnalyticsEvents,
  getRecordedAnalyticsEvents,
  configureAnalyticsRuntimeForTest,
} from '../src/services/analytics';
import { PANTRY_PRODUCTS } from '../src/data/product';

console.log('=== GA4 Configuration & Verification Suite ===\n');

let pass = 0;
let fail = 0;

function check(cond: boolean, name: string) {
  if (cond) {
    console.log(`✓ ${name}: PASS`);
    pass++;
  } else {
    console.error(`✗ ${name}: FAIL`);
    fail++;
  }
}

// Reset test overrides to test actual runtime resolution
configureAnalyticsRuntimeForTest({ measurementId: undefined });

// 1. Measurement ID resolution
const currentId = getMeasurementId();
check(currentId === 'G-K1R0QB4M3F', `getMeasurementId resolves to G-K1R0QB4M3F (actual: ${currentId})`);
check(DEFAULT_PRODUCTION_MEASUREMENT_ID === 'G-K1R0QB4M3F', 'DEFAULT_PRODUCTION_MEASUREMENT_ID is G-K1R0QB4M3F');
check(isValidMeasurementId(currentId), 'Measurement ID G-K1R0QB4M3F is valid according to GA4 format regex');

// 2. Cookie consent verification
resetAnalyticsConsent();
check(getAnalyticsConsent() === 'unset', 'Consent initial state is unset');
denyAnalyticsConsent();
check(getAnalyticsConsent() === 'denied', 'Consent transition to denied works');
grantAnalyticsConsent();
check(getAnalyticsConsent() === 'granted', 'Consent transition to granted works');

// 3. Product catalog SKU, price, quantity, and currency checks
const expectedProducts = [
  { sku: 'NYM-PREM-100', price: 160 },
  { sku: 'NYM-PREM-200', price: 310 },
  { sku: 'NYM-PREM-250', price: 380 },
  { sku: 'NYM-NORM-100', price: 120 },
  { sku: 'NYM-NORM-200', price: 230 },
  { sku: 'NYM-NORM-250', price: 280 },
];

for (const exp of expectedProducts) {
  const prod = PANTRY_PRODUCTS.find((p) => p.sku === exp.sku);
  check(Boolean(prod), `Product ${exp.sku} exists in catalog`);
  if (prod) {
    const gaItem = toGA4Item(prod, 2);
    check(gaItem.item_id === exp.sku, `Item ${exp.sku} has correct item_id`);
    check(gaItem.price === exp.price, `Item ${exp.sku} has correct price ₹${exp.price}`);
    check(gaItem.quantity === 2, `Item ${exp.sku} reflects quantity 2`);
    check(gaItem.item_brand === 'NYUTA ELITE MAKHANA', `Item ${exp.sku} has correct brand`);
  }
}

// 4. Strict PII & Credential Sanitization
const dirtyPayload = {
  currency: 'INR',
  value: 380,
  email: 'customer@gmail.com',
  phone: '+919876543210',
  address: '123 Makhana Road, Mithila, Bihar',
  pincode: '846004',
  razorpay_signature: 'abc123secret456',
  razorpaykeysecret: 'rzp_live_secret123',
  password: 'myPassword123!',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  safeField: 'harmless_tag',
};

const cleanPayload = sanitizeAnalyticsParams(dirtyPayload);
check(cleanPayload.email === undefined, 'PII stripped: email');
check(cleanPayload.phone === undefined, 'PII stripped: phone');
check(cleanPayload.address === undefined, 'PII stripped: address');
check(cleanPayload.pincode === undefined, 'PII stripped: pincode');
check(cleanPayload.razorpay_signature === undefined, 'Security stripped: razorpay_signature');
check(cleanPayload.razorpaykeysecret === undefined, 'Security stripped: razorpaykeysecret');
check(cleanPayload.password === undefined, 'Security stripped: password');
check(cleanPayload.token === undefined, 'Security stripped: token');
check(cleanPayload.safeField === 'harmless_tag', 'Legitimate parameters preserved');
check(cleanPayload.value === 380, 'Financial value preserved');

// 5. Purchase only on CAPTURED payment and idempotent
clearLocalAnalyticsIdempotencyCache();
clearRecordedAnalyticsEvents();

const unverifiedOrder = {
  transactionId: 'ORD_VERIFY_001',
  paymentStatus: 'AUTHORIZED', // Not CAPTURED
  value: 380,
  items: [toGA4Item(PANTRY_PRODUCTS[0], 1)],
};
const resUnverified = trackPurchase(unverifiedOrder as any);
check(resUnverified === false, 'Purchase rejected for uncaptured payment (AUTHORIZED)');
check(!hasTrackedPurchase('ORD_VERIFY_001'), 'Uncaptured transaction not marked as tracked');

const verifiedOrder = {
  transactionId: 'ORD_VERIFY_001',
  paymentStatus: 'CAPTURED', // CAPTURED
  value: 380,
  items: [toGA4Item(PANTRY_PRODUCTS[0], 1)],
};
const resVerified = trackPurchase(verifiedOrder as any);
check(resVerified === true, 'Purchase accepted for CAPTURED payment');
check(hasTrackedPurchase('ORD_VERIFY_001'), 'Captured transaction marked as tracked in storage');

// Duplicate check
const resDup = trackPurchase(verifiedOrder as any);
check(resDup === false, 'Duplicate purchase blocked for ORD_VERIFY_001');

console.log(`\nGA4 Config Test Summary: ${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);

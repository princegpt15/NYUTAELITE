// scripts/test_ga4_events.ts
import {
  configureAnalyticsRuntimeForTest,
  grantAnalyticsConsent,
  denyAnalyticsConsent,
  getAnalyticsConsent,
  trackPageView,
  trackViewItemList,
  trackSelectItem,
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  trackPurchase,
  trackRefund,
  getRecordedAnalyticsEvents,
  clearRecordedAnalyticsEvents,
  clearLocalAnalyticsIdempotencyCache,
} from '../src/services/analytics';
import { PANTRY_PRODUCTS } from '../src/data/product';

console.log('=== GA4 E-Commerce Analytics Automated Test Suite ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✓ ${testName}: PASS`);
    passCount++;
  } else {
    console.error(`✗ ${testName}: FAIL`);
    failCount++;
  }
}

// 1. Consent gating test
configureAnalyticsRuntimeForTest({ measurementId: 'G-TESTMEASURE1', debug: false });
denyAnalyticsConsent();
clearRecordedAnalyticsEvents();

trackPageView({ path: '/products/makhana', title: 'Products' });
assert(
  getRecordedAnalyticsEvents().length === 0,
  'Consent gating: No events recorded when consent is denied'
);

// 2. Grant consent and test page_view
grantAnalyticsConsent();
assert(getAnalyticsConsent() === 'granted', 'Consent state updated to granted');

trackPageView({ path: '/products/makhana', title: 'Products' });
let events = getRecordedAnalyticsEvents();
assert(events.length === 1 && events[0].eventName === 'page_view', 'Event 1: page_view recorded correctly');

// 3. view_item_list
clearRecordedAnalyticsEvents();
trackViewItemList({
  listId: 'pantry_all',
  listName: 'All Makhana Packs',
  products: PANTRY_PRODUCTS,
});
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'view_item_list' &&
    events[0].params.items.length === 6,
  'Event 2: view_item_list emits 6 items'
);

// 4. select_item
clearRecordedAnalyticsEvents();
trackSelectItem({
  product: PANTRY_PRODUCTS[0],
  listId: 'pantry_all',
  listName: 'All Makhana Packs',
});
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'select_item' &&
    events[0].params.items[0].item_id === 'NYM-PREM-100',
  'Event 3: select_item with correct item_id'
);

// 5. view_item
clearRecordedAnalyticsEvents();
trackViewItem(PANTRY_PRODUCTS[0]);
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'view_item' &&
    events[0].params.value === 160 &&
    events[0].params.currency === 'INR',
  'Event 4: view_item with ₹160 and INR currency'
);

// 6. add_to_cart (takes product and quantity)
clearRecordedAnalyticsEvents();
trackAddToCart(PANTRY_PRODUCTS[0], 2);
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'add_to_cart' &&
    events[0].params.value === 320 &&
    events[0].params.items[0].quantity === 2,
  'Event 5: add_to_cart with quantity 2 and value ₹320'
);

// 7. remove_from_cart
clearRecordedAnalyticsEvents();
trackRemoveFromCart(PANTRY_PRODUCTS[0], 1);
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'remove_from_cart' &&
    events[0].params.value === 160,
  'Event 6: remove_from_cart with correct params'
);

// 8. view_cart (takes array of CartItem)
clearRecordedAnalyticsEvents();
const mockCart = [
  {
    productId: PANTRY_PRODUCTS[0].id,
    product: PANTRY_PRODUCTS[0],
    quantity: 1,
    price: 160,
    weightGrams: 100,
  } as any,
];
trackViewCart(mockCart);
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'view_cart' &&
    events[0].params.value === 160,
  'Event 7: view_cart with value ₹160'
);

// 9. begin_checkout
clearRecordedAnalyticsEvents();
trackBeginCheckout({
  cartItems: mockCart,
  value: 160,
});
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'begin_checkout' &&
    events[0].params.value === 160,
  'Event 8: begin_checkout with value ₹160'
);

// 10. add_shipping_info
clearRecordedAnalyticsEvents();
trackAddShippingInfo({
  cartItems: mockCart,
  value: 160,
  shippingTier: 'Standard Pan-India Delivery',
});
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'add_shipping_info' &&
    events[0].params.shipping_tier === 'Standard Pan-India Delivery' &&
    events[0].params.value === 160,
  'Event 9: add_shipping_info with shipping tier and value'
);

// 11. add_payment_info
clearRecordedAnalyticsEvents();
trackAddPaymentInfo({
  cartItems: mockCart,
  value: 160,
  paymentType: 'Razorpay UPI / Cards',
});
events = getRecordedAnalyticsEvents();
assert(
  events.length === 1 &&
    events[0].eventName === 'add_payment_info' &&
    events[0].params.payment_type === 'Razorpay UPI / Cards' &&
    events[0].params.value === 160,
  'Event 10: add_payment_info with payment type and value'
);

// 12. purchase & Idempotency / Duplicate Prevention
clearRecordedAnalyticsEvents();
clearLocalAnalyticsIdempotencyCache();

const purchasePayload = {
  transactionId: 'ORD_TEST_99991',
  paymentStatus: 'CAPTURED',
  value: 380,
  shipping: 0,
  tax: 0,
  items: [{ product: PANTRY_PRODUCTS[2], quantity: 1, price: 380 }],
};

const firstAttempt = trackPurchase(purchasePayload as any);
assert(firstAttempt === true, 'Event 11: purchase fires when paymentStatus is CAPTURED');

// Second attempt with same transaction ID should be blocked by idempotency
clearRecordedAnalyticsEvents();
const secondAttempt = trackPurchase(purchasePayload as any);
assert(secondAttempt === false, 'Duplicate purchase prevention: blocked duplicate transaction ID');

// 13. Uncaptured payment should NOT fire purchase
clearRecordedAnalyticsEvents();
const uncapturedAttempt = trackPurchase({
  transactionId: 'ORD_TEST_UNPAID',
  paymentStatus: 'PENDING',
  value: 160,
} as any);
assert(uncapturedAttempt === false, 'Payment safety: purchase does NOT fire for PENDING payments');

// 14. refund & Duplicate Prevention
clearRecordedAnalyticsEvents();
const refundAttempt = trackRefund({
  transactionId: 'ORD_TEST_99991',
  refundId: 'RFND_001',
  value: 380,
});
assert(refundAttempt === true, 'Event 12: refund fires for valid transaction');

const duplicateRefund = trackRefund({
  transactionId: 'ORD_TEST_99991',
  refundId: 'RFND_001',
  value: 380,
});
assert(duplicateRefund === false, 'Duplicate refund prevention: blocked duplicate refund ID');

console.log(`\nGA4 Test Summary: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
}

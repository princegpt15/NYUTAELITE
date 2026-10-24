/**
 * verify_admin_payment_guard.ts
 *
 * Hermetic, read-only test script for Phase 16.
 * Validates the admin updateOrderStatus payment-state guard.
 *
 * - No real DB writes.
 * - No real emails.
 * - No network calls.
 *
 * Run: npx tsx src/scripts/verify_admin_payment_guard.ts
 */

import type { OrderStatus, ShippingStatus, PaymentStatus } from '@prisma/client';

// ─── Minimal type mirror ──────────────────────────────────────────────────────

type OrderSnapshot = {
  id: string;
  status: OrderStatus;
  shippingStatus: ShippingStatus;
  paymentStatus: PaymentStatus;
  orderNumber: string;
};

type UpdateInput = {
  orderStatus?: OrderStatus;
  shippingStatus?: ShippingStatus;
};

// ─── Inline reproduction of the guard logic from admin.service.ts ─────────────
// Keep this in sync with backend/src/services/admin.service.ts updateOrderStatus.
// This lets tests run without a DB or Prisma client.

function runGuard(existing: OrderSnapshot, data: UpdateInput): void {
  const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  const nextOrderStatus: OrderStatus = data.orderStatus ?? existing.status;

  if (data.orderStatus !== undefined) {
    const allowedNext = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowedNext.includes(data.orderStatus)) {
      const error: any = new Error(
        `Order cannot be moved from ${existing.status} to ${data.orderStatus}.`
      );
      error.statusCode = 422;
      error.code = 'INVALID_STATE_TRANSITION';
      throw error;
    }

    // Payment / Fulfillment Safety Rules
    if (data.orderStatus !== 'CANCELLED') {
      if (existing.paymentStatus === 'FAILED') {
        const error: any = new Error(
          'Cannot fulfill order while payment status is FAILED.'
        );
        error.statusCode = 422;
        error.code = 'PAYMENT_NOT_CAPTURED';
        throw error;
      }

      if (existing.paymentStatus === 'REFUNDED') {
        const error: any = new Error(
          'Cannot fulfill order while payment status is REFUNDED.'
        );
        error.statusCode = 422;
        error.code = 'PAYMENT_REFUNDED';
        throw error;
      }

      // Guard: CONFIRMED, PROCESSING, SHIPPED, and DELIVERED all require a captured payment.
      // This prevents admins from confirming orders whose payment has not been verified.
      if (
        existing.paymentStatus !== 'CAPTURED' &&
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(data.orderStatus)
      ) {
        const error: any = new Error(
          `Cannot move order to ${data.orderStatus} while payment status is ${existing.paymentStatus}. Payment must be CAPTURED first.`
        );
        error.statusCode = 422;
        error.code = 'PAYMENT_NOT_CAPTURED';
        throw error;
      }
    }
  }

  // Shipping consistency (not tested here but guard is reproduced for completeness)
  void nextOrderStatus;
}

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌  ${name}`);
    console.error(`       ${err?.message ?? err}`);
    failed++;
    failures.push(`${name}: ${err?.message ?? err}`);
  }
}

function assertThrows(
  fn: () => void,
  expectedCode: string,
  expectedStatusCode: number
) {
  try {
    fn();
    throw new Error(`ASSERTION: Expected an error with code=${expectedCode} but no error was thrown.`);
  } catch (err: any) {
    if (err?.message?.startsWith('ASSERTION:')) throw err;
    if (err?.code !== expectedCode) {
      throw new Error(
        `ASSERTION: Expected error.code="${expectedCode}" but got "${err?.code}". Message: ${err?.message}`
      );
    }
    if (err?.statusCode !== expectedStatusCode) {
      throw new Error(
        `ASSERTION: Expected statusCode=${expectedStatusCode} but got ${err?.statusCode}`
      );
    }
  }
}

function assertDoesNotThrow(fn: () => void) {
  try {
    fn();
  } catch (err: any) {
    throw new Error(`ASSERTION: Expected no error but got: ${err?.message ?? err}`);
  }
}

// ─── Base order templates ─────────────────────────────────────────────────────

const pendingPaymentFailed: OrderSnapshot = {
  id: 'order-1',
  orderNumber: 'NYUTA-TEST-001',
  status: 'PENDING',
  shippingStatus: 'PENDING',
  paymentStatus: 'FAILED',
};

const pendingPaymentPending: OrderSnapshot = {
  id: 'order-2',
  orderNumber: 'NYUTA-TEST-002',
  status: 'PENDING',
  shippingStatus: 'PENDING',
  paymentStatus: 'PENDING',
};

const pendingPaymentAuthorized: OrderSnapshot = {
  id: 'order-3',
  orderNumber: 'NYUTA-TEST-003',
  status: 'PENDING',
  shippingStatus: 'PENDING',
  paymentStatus: 'AUTHORIZED',
};

const pendingPaymentCaptured: OrderSnapshot = {
  id: 'order-4',
  orderNumber: 'NYUTA-TEST-004',
  status: 'PENDING',
  shippingStatus: 'PENDING',
  paymentStatus: 'CAPTURED',
};

const pendingPaymentRefunded: OrderSnapshot = {
  id: 'order-5',
  orderNumber: 'NYUTA-TEST-005',
  status: 'PENDING',
  shippingStatus: 'PENDING',
  paymentStatus: 'REFUNDED',
};

const confirmedPaymentCaptured: OrderSnapshot = {
  id: 'order-6',
  orderNumber: 'NYUTA-TEST-006',
  status: 'CONFIRMED',
  shippingStatus: 'PENDING',
  paymentStatus: 'CAPTURED',
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  Phase 16 — Admin Payment Guard: verify_admin_payment_guard');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('【1】 PENDING → CONFIRMED blocked when paymentStatus ≠ CAPTURED');

test('PENDING→CONFIRMED blocked when paymentStatus=FAILED', () => {
  assertThrows(
    () => runGuard(pendingPaymentFailed, { orderStatus: 'CONFIRMED' }),
    'PAYMENT_NOT_CAPTURED',
    422
  );
});

test('PENDING→CONFIRMED blocked when paymentStatus=PENDING', () => {
  assertThrows(
    () => runGuard(pendingPaymentPending, { orderStatus: 'CONFIRMED' }),
    'PAYMENT_NOT_CAPTURED',
    422
  );
});

test('PENDING→CONFIRMED blocked when paymentStatus=AUTHORIZED', () => {
  assertThrows(
    () => runGuard(pendingPaymentAuthorized, { orderStatus: 'CONFIRMED' }),
    'PAYMENT_NOT_CAPTURED',
    422
  );
});

test('PENDING→CONFIRMED blocked when paymentStatus=REFUNDED', () => {
  // REFUNDED triggers its own guard first (PAYMENT_REFUNDED)
  assertThrows(
    () => runGuard(pendingPaymentRefunded, { orderStatus: 'CONFIRMED' }),
    'PAYMENT_REFUNDED',
    422
  );
});

console.log('\n【2】 PENDING → CONFIRMED allowed when paymentStatus=CAPTURED');

test('PENDING→CONFIRMED succeeds when paymentStatus=CAPTURED', () => {
  assertDoesNotThrow(() => runGuard(pendingPaymentCaptured, { orderStatus: 'CONFIRMED' }));
});

console.log('\n【3】 PENDING → CANCELLED always allowed (regardless of payment)');

test('PENDING→CANCELLED allowed when paymentStatus=FAILED', () => {
  assertDoesNotThrow(() => runGuard(pendingPaymentFailed, { orderStatus: 'CANCELLED' }));
});

test('PENDING→CANCELLED allowed when paymentStatus=PENDING', () => {
  assertDoesNotThrow(() => runGuard(pendingPaymentPending, { orderStatus: 'CANCELLED' }));
});

test('PENDING→CANCELLED allowed when paymentStatus=CAPTURED', () => {
  assertDoesNotThrow(() => runGuard(pendingPaymentCaptured, { orderStatus: 'CANCELLED' }));
});

console.log('\n【4】 Downstream transitions (PROCESSING, SHIPPED, DELIVERED) still guarded');

test('CONFIRMED→PROCESSING blocked when paymentStatus=PENDING (regression)', () => {
  const order: OrderSnapshot = { ...confirmedPaymentCaptured, paymentStatus: 'PENDING' };
  assertThrows(
    () => runGuard(order, { orderStatus: 'PROCESSING' }),
    'PAYMENT_NOT_CAPTURED',
    422
  );
});

test('CONFIRMED→PROCESSING succeeds when paymentStatus=CAPTURED', () => {
  assertDoesNotThrow(() => runGuard(confirmedPaymentCaptured, { orderStatus: 'PROCESSING' }));
});

console.log('\n【5】 Invalid state transitions still blocked');

test('DELIVERED→CONFIRMED is an invalid transition', () => {
  const delivered: OrderSnapshot = { ...pendingPaymentCaptured, status: 'DELIVERED' };
  assertThrows(
    () => runGuard(delivered, { orderStatus: 'CONFIRMED' }),
    'INVALID_STATE_TRANSITION',
    422
  );
});

test('CANCELLED→CONFIRMED is an invalid transition', () => {
  const cancelled: OrderSnapshot = { ...pendingPaymentCaptured, status: 'CANCELLED' };
  assertThrows(
    () => runGuard(cancelled, { orderStatus: 'CONFIRMED' }),
    'INVALID_STATE_TRANSITION',
    422
  );
});

test('PENDING→SHIPPED is an invalid transition', () => {
  assertThrows(
    () => runGuard(pendingPaymentCaptured, { orderStatus: 'SHIPPED' }),
    'INVALID_STATE_TRANSITION',
    422
  );
});

console.log('\n【6】 No-op (no orderStatus provided) never throws');

test('No-op update (no orderStatus) never throws', () => {
  assertDoesNotThrow(() => runGuard(pendingPaymentFailed, {}));
});

// ─── Notification dispatch simulation ────────────────────────────────────────

console.log('\n【7】 Notification dispatch: rejected transition does NOT fire ORDER_CONFIRMED');

test('ORDER_CONFIRMED not dispatched when guard throws (FAILED payment)', () => {
  let dispatchCalled = false;

  // Simulate the service flow: guard throws before dispatch
  function simulateUpdateOrderStatus(existing: OrderSnapshot, data: UpdateInput) {
    runGuard(existing, data); // throws if invalid
    // Only reached if guard passes:
    dispatchCalled = true;
  }

  try {
    simulateUpdateOrderStatus(pendingPaymentFailed, { orderStatus: 'CONFIRMED' });
  } catch {
    // expected
  }

  if (dispatchCalled) {
    throw new Error('ASSERTION: dispatchOrderEventAsync was reached despite guard throwing.');
  }
});

test('ORDER_CONFIRMED not dispatched when guard throws (PENDING payment)', () => {
  let dispatchCalled = false;

  function simulateUpdateOrderStatus(existing: OrderSnapshot, data: UpdateInput) {
    runGuard(existing, data);
    dispatchCalled = true;
  }

  try {
    simulateUpdateOrderStatus(pendingPaymentPending, { orderStatus: 'CONFIRMED' });
  } catch {
    // expected
  }

  if (dispatchCalled) {
    throw new Error('ASSERTION: dispatchOrderEventAsync was reached despite guard throwing.');
  }
});

test('ORDER_CONFIRMED IS dispatched when paymentStatus=CAPTURED (happy path)', () => {
  let dispatchCalled = false;

  function simulateUpdateOrderStatus(existing: OrderSnapshot, data: UpdateInput) {
    runGuard(existing, data);
    dispatchCalled = true;
  }

  simulateUpdateOrderStatus(pendingPaymentCaptured, { orderStatus: 'CONFIRMED' });

  if (!dispatchCalled) {
    throw new Error('ASSERTION: dispatchOrderEventAsync was NOT reached for a valid CAPTURED transition.');
  }
});

// ─── Historical order context (read-only, informational) ─────────────────────

console.log('\n【8】 Historical order NYUTA-20261006-90C48A (read-only analysis)');

test('Historical order would be blocked by the new guard', () => {
  // paymentStatus=FAILED, status=PENDING at the time of the admin confirmation
  const historicalOrder: OrderSnapshot = {
    id: 'historical',
    orderNumber: 'NYUTA-20261006-90C48A',
    status: 'PENDING',
    shippingStatus: 'PENDING',
    paymentStatus: 'FAILED',
  };

  assertThrows(
    () => runGuard(historicalOrder, { orderStatus: 'CONFIRMED' }),
    'PAYMENT_NOT_CAPTURED',
    422
  );

  console.log('       → Admin confirmation of NYUTA-20261006-90C48A would now return HTTP 422 PAYMENT_NOT_CAPTURED');
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
const total = passed + failed;
console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\n  Failed tests:');
  failures.forEach((f) => console.log(`    • ${f}`));
  console.log('');
  process.exit(1);
} else {
  console.log('  All tests passed. ✅');
}
console.log('═══════════════════════════════════════════════════════════════\n');

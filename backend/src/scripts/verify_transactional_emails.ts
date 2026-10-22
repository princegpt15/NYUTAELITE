// backend/src/scripts/verify_transactional_emails.ts
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';
import { notificationService } from '../services/notification/notification.service.js';
import { renderNotificationTemplate } from '../services/notification/notification.templates.js';
import {
  emailNotificationProvider,
  setCustomSmtpTransporter,
  setEmailProviderTestSimulator,
} from '../services/notification/providers/email.provider.js';
import type { OrderNotificationContext } from '../services/notification/notification.types.js';

let passedTests = 0;
let failedTests = 0;
let origProvider = env.EMAIL_PROVIDER;
let origEnabled = env.EMAIL_ENABLED;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

async function runEmailVerificationSuite() {
  console.log('================================================================');
  console.log('  NYUTA ELITE MAKHANA — TRANSACTIONAL EMAIL VERIFICATION SUITE  ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Template Rendering & Verified Compliance Details
  // --------------------------------------------------------------------------
  console.log('=== TEST 1: Template Rendering & Compliance Details ===');
  const mockContext: OrderNotificationContext = {
    orderId: 'test_order_compliance_001',
    orderNumber: 'NYUTA-20261022-COMPLIANCE',
    userId: 'user_compliance_001',
    customerName: 'Raushan Kumar',
    customerEmail: 'customer@example.com',
    customerPhone: '+91 81028 75852',
    orderDate: new Date('2026-10-22T10:00:00Z'),
    status: 'CONFIRMED',
    paymentStatus: 'CAPTURED',
    shippingStatus: 'PENDING',
    subtotal: 598,
    discountAmount: 50,
    couponCode: 'FESTIVE50',
    shippingAmount: 0,
    taxAmount: 0,
    totalAmount: 548,
    currency: 'INR',
    items: [
      {
        productName: 'NYUTA Elite Classic Roasted Makhana 200g <script>alert(1)</script>',
        quantity: 2,
        price: 299,
        subtotal: 598,
      },
    ],
    shippingAddress: {
      fullName: 'Raushan Kumar',
      addressLine1: 'Krishna Vihar Lock No. 11',
      addressLine2: 'Bahiro Ara',
      city: 'Arrah',
      state: 'Bihar',
      postalCode: '802301',
      country: 'India',
      phone: '+91 81028 75852',
    },
    paymentReference: 'pay_rzp_test_123456',
  };

  const orderConfirmedTemplate = renderNotificationTemplate('ORDER_CONFIRMED', mockContext);
  const paymentSuccessTemplate = renderNotificationTemplate('PAYMENT_SUCCESS', mockContext);
  const orderShippedTemplate = renderNotificationTemplate('ORDER_SHIPPED', mockContext);

  assert(
    orderConfirmedTemplate.subject.includes('NYUTA-20261022-COMPLIANCE'),
    'Order Confirmed subject includes correct order number'
  );
  assert(
    orderConfirmedTemplate.html.includes('20426021000494'),
    'Email HTML footer includes verified FSSAI Registration 20426021000494'
  );
  assert(
    orderConfirmedTemplate.html.includes('Krishna Vihar Lock No. 11, Bahiro Ara'),
    'Email HTML footer includes verified business address'
  );
  assert(
    orderConfirmedTemplate.html.includes('info@nutyaelite.com'),
    'Official business support email is info@nutyaelite.com'
  );
  assert(
    orderConfirmedTemplate.html.includes('+91 81028 75852'),
    'Official support phone is +91 81028 75852'
  );
  assert(
    orderConfirmedTemplate.html.includes('1–2 business days') &&
      orderConfirmedTemplate.html.includes('5–7 business days'),
    'Confirmed shipping timeline (1-2 days processing + 5-7 days transit) is clearly stated'
  );
  assert(
    !orderConfirmedTemplate.html.includes('<script>alert(1)</script>') &&
      orderConfirmedTemplate.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'),
    'XSS safety: HTML tags in item names are escaped'
  );

  assert(
    paymentSuccessTemplate.subject.includes('Payment Received'),
    'Payment Success subject line is correctly formatted'
  );
  assert(
    paymentSuccessTemplate.html.includes('pay_rzp_test_123456'),
    'Payment Success email includes authoritative gateway reference'
  );

  assert(
    orderShippedTemplate.subject.includes('Order Shipped'),
    'Order Shipped subject line is correctly formatted'
  );
  assert(
    orderShippedTemplate.html.includes('5–7 business days'),
    'Order Shipped email reiterates courier transit timeline'
  );

  // --------------------------------------------------------------------------
  // TEST 2: Environment Configuration & Defaults
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 2: Environment Configuration & Defaults ===');
  assert(
    env.SMTP_HOST === 'smtpout.secureserver.net',
    'SMTP_HOST defaults to GoDaddy Workspace SMTP (smtpout.secureserver.net)'
  );
  assert(env.SMTP_PORT === 465, 'SMTP_PORT defaults to 465 (SSL)');
  assert(env.SMTP_SECURE === true, 'SMTP_SECURE defaults to true');
  assert(env.EMAIL_FROM_ADDRESS === 'info@nutyaelite.com', 'EMAIL_FROM_ADDRESS is info@nutyaelite.com');
  assert(
    env.EMAIL_TEST_RECIPIENT === 'enterprisesp0r@gmail.com',
    'EMAIL_TEST_RECIPIENT is enterprisesp0r@gmail.com'
  );
  assert(env.EMAIL_TEST_MODE === true, 'EMAIL_TEST_MODE is true by default for local development safety');

  // --------------------------------------------------------------------------
  // TEST 3: Safe Test Mode Redirection
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 3: Test Mode Interception & Mailbox Routing ===');
  let capturedSentMail: any = null;
  const mockTransport = nodemailer.createTransport({
    name: 'test-transport',
    version: '1.0.0',
    send: (mail: any, callback: any) => {
      capturedSentMail = mail.data;
      callback(null, {
        messageId: `<mock_${Date.now()}@nutyaelite.com>`,
        envelope: mail.message.getEnvelope(),
        accepted: [mail.data.to],
        rejected: [],
        pending: [],
        response: '250 OK mock test delivery',
      });
    },
  } as any);

  setCustomSmtpTransporter(mockTransport);

  // Override env temporarily for provider check
  origProvider = env.EMAIL_PROVIDER;
  origEnabled = env.EMAIL_ENABLED;
  (env as any).EMAIL_PROVIDER = 'smtp';
  (env as any).EMAIL_ENABLED = true;

  const testDeliveryResult = await emailNotificationProvider.send({
    notificationId: 'notif_test_intercept_001',
    orderId: 'order_test_001',
    orderNumber: 'NYUTA-TEST-001',
    type: 'ORDER_CONFIRMED',
    channel: 'EMAIL',
    recipient: 'unsuspecting_customer@gmail.com',
    subject: 'Order Confirmed — NYUTA-TEST-001',
    text: 'Your order was confirmed.',
    html: '<p>Your order was confirmed.</p>',
  });

  assert(testDeliveryResult.success === true, 'Send succeeded via SMTP test transporter');
  assert(
    capturedSentMail && capturedSentMail.to === 'enterprisesp0r@gmail.com',
    'Safety interception: customer email rewritten to EMAIL_TEST_RECIPIENT (enterprisesp0r@gmail.com)'
  );
  assert(
    capturedSentMail.subject.includes('[TEST to unsuspecting_customer@gmail.com]'),
    'Subject line explicitly flags test recipient redirection'
  );
  assert(
    capturedSentMail.headers &&
      capturedSentMail.headers['X-Original-Recipient'] === 'unsuspecting_customer@gmail.com',
    'Original recipient preserved in X-Original-Recipient header'
  );

  // --------------------------------------------------------------------------
  // TEST 4: Disabled Mode Safety Guard
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 4: Disabled Mode Safety Guard ===');
  (env as any).EMAIL_ENABLED = false;
  const disabledDeliveryResult = await emailNotificationProvider.send({
    notificationId: 'notif_test_disabled_001',
    orderId: 'order_test_001',
    orderNumber: 'NYUTA-TEST-001',
    type: 'ORDER_CONFIRMED',
    channel: 'EMAIL',
    recipient: 'customer@example.com',
    subject: 'Should not send',
    text: 'Should not send',
  });

  assert(
    disabledDeliveryResult.success === false,
    'Sending is disallowed when EMAIL_ENABLED=false'
  );
  assert(
    disabledDeliveryResult.errorCode === 'EMAIL_PROVIDER_DISABLED',
    'Error code is EMAIL_PROVIDER_DISABLED when disabled'
  );
  assert(
    disabledDeliveryResult.retryable === false,
    'Disabled provider error is marked non-retryable'
  );

  // Set provider to mock for isolated database & lifecycle regression tests
  setCustomSmtpTransporter(null);
  (env as any).EMAIL_PROVIDER = 'mock';
  (env as any).EMAIL_ENABLED = true;

  // --------------------------------------------------------------------------
  // TEST 5: Database Idempotency & Duplicate Prevention
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 5: PostgreSQL Database Idempotency ===');
  // Find or create a test user and order
  let testUser = await prisma.user.findFirst({ where: { email: 'test_email_audit@nutyaelite.com' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test_email_audit@nutyaelite.com',
        passwordHash: 'test_password_hash_audit',
        name: 'Email Audit User',
        role: 'CUSTOMER',
        phone: '+91 81028 75852',
      },
    });
  }

  const testOrderNumber = `NYUTA-AUDIT-${Date.now().toString().slice(-6)}`;
  const testOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      orderNumber: testOrderNumber,
      subtotal: 499,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: 499,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      shippingStatus: 'PENDING',
      shippingAddress: {
        fullName: 'Email Audit User',
        addressLine1: 'Krishna Vihar Lock No. 11',
        city: 'Arrah',
        state: 'Bihar',
        postalCode: '802301',
        country: 'India',
        phone: '+91 81028 75852',
      },
    },
  });

  // Dispatch ORDER_CONFIRMED first time
  const notif1 = await notificationService.dispatchSingleChannel(
    {
      orderId: testOrder.id,
      orderNumber: testOrder.orderNumber,
      userId: testUser.id,
      customerName: testUser.name || 'Email Audit User',
      customerEmail: testUser.email || 'test@nutyaelite.com',
      customerPhone: testUser.phone,
      orderDate: testOrder.createdAt,
      status: testOrder.status,
      paymentStatus: testOrder.paymentStatus,
      shippingStatus: testOrder.shippingStatus,
      subtotal: testOrder.subtotal,
      discountAmount: Number(testOrder.discountAmount),
      couponCode: null,
      shippingAmount: Number(testOrder.shippingAmount),
      taxAmount: Number(testOrder.taxAmount),
      totalAmount: testOrder.totalAmount,
      currency: testOrder.currency,
      items: [{ productName: 'Classic Makhana 250g', quantity: 1, price: 499, subtotal: 499 }],
      shippingAddress: testOrder.shippingAddress as any,
    },
    'ORDER_CONFIRMED',
    'EMAIL'
  );

  assert(notif1 !== null && notif1.status === 'SENT', 'First dispatch creates and sends notification');

  // Dispatch ORDER_CONFIRMED second time (simulating duplicate webhook / repeated caller)
  const notif2 = await notificationService.dispatchSingleChannel(
    {
      orderId: testOrder.id,
      orderNumber: testOrder.orderNumber,
      userId: testUser.id,
      customerName: testUser.name || 'Email Audit User',
      customerEmail: testUser.email || 'test@nutyaelite.com',
      customerPhone: testUser.phone,
      orderDate: testOrder.createdAt,
      status: testOrder.status,
      paymentStatus: testOrder.paymentStatus,
      shippingStatus: testOrder.shippingStatus,
      subtotal: testOrder.subtotal,
      discountAmount: Number(testOrder.discountAmount),
      couponCode: null,
      shippingAmount: Number(testOrder.shippingAmount),
      taxAmount: Number(testOrder.taxAmount),
      totalAmount: testOrder.totalAmount,
      currency: testOrder.currency,
      items: [{ productName: 'Classic Makhana 250g', quantity: 1, price: 499, subtotal: 499 }],
      shippingAddress: testOrder.shippingAddress as any,
    },
    'ORDER_CONFIRMED',
    'EMAIL'
  );

  assert(notif2 !== null && notif2.id === notif1?.id, 'Second dispatch returns existing record (skipped resend)');

  const totalNotifRecords = await prisma.notification.count({
    where: {
      orderId: testOrder.id,
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
    },
  });

  assert(totalNotifRecords === 1, 'Database contains exactly 1 notification record (unique idempotencyKey)');

  // --------------------------------------------------------------------------
  // TEST 6: Webhook Idempotency Reconciliation
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 6: Webhook Idempotency Simulation ===');
  // Call reconcilePaymentNotificationsForOrder twice
  await notificationService.reconcilePaymentNotificationsForOrder(testOrder.id);
  await notificationService.reconcilePaymentNotificationsForOrder(testOrder.id);

  const paymentSuccessCount = await prisma.notification.count({
    where: {
      orderId: testOrder.id,
      type: 'PAYMENT_SUCCESS',
      channel: 'EMAIL',
    },
  });

  assert(paymentSuccessCount === 1, 'Payment reconciliation produces exactly 1 PAYMENT_SUCCESS notification');

  // --------------------------------------------------------------------------
  // TEST 7: Failure Isolation Guarantee
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 7: Failure Isolation Guarantee ===');
  // Inject simulated SMTP error
  setEmailProviderTestSimulator((_req, _attempt) => {
    return {
      success: false,
      retryable: false,
      provider: 'smtp-simulated-failure',
      providerMessageId: null,
      errorCode: 'SMTP_CONN_REFUSED',
      message: 'Simulated connection refused to SMTP server',
    };
  });

  const failureOrderNumber = `NYUTA-FAIL-${Date.now().toString().slice(-6)}`;
  const failureOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      orderNumber: failureOrderNumber,
      subtotal: 299,
      discountAmount: 0,
      shippingAmount: 40,
      taxAmount: 0,
      totalAmount: 339,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      shippingStatus: 'PENDING',
      shippingAddress: {
        fullName: 'Failure Test User',
        addressLine1: 'Krishna Vihar Lock No. 11',
        city: 'Arrah',
        state: 'Bihar',
        postalCode: '802301',
        country: 'India',
        phone: '+91 81028 75852',
      },
    },
  });

  let threwError = false;
  try {
    // Calling dispatchSingleChannel with simulated failure
    const failedNotif = await notificationService.dispatchSingleChannel(
      {
        orderId: failureOrder.id,
        orderNumber: failureOrder.orderNumber,
        userId: testUser.id,
        customerName: testUser.name || 'Failure Test User',
        customerEmail: testUser.email || 'test@nutyaelite.com',
        customerPhone: testUser.phone,
        orderDate: failureOrder.createdAt,
        status: failureOrder.status,
        paymentStatus: failureOrder.paymentStatus,
        shippingStatus: failureOrder.shippingStatus,
        subtotal: failureOrder.subtotal,
        discountAmount: 0,
        couponCode: null,
        shippingAmount: 40,
        taxAmount: 0,
        totalAmount: failureOrder.totalAmount,
        currency: failureOrder.currency,
        items: [{ productName: 'Trial Pack 100g', quantity: 1, price: 299, subtotal: 299 }],
        shippingAddress: failureOrder.shippingAddress as any,
      },
      'ORDER_CONFIRMED',
      'EMAIL'
    );

    assert(failedNotif !== null, 'Failed notification record returned cleanly');
    assert(failedNotif?.status === 'FAILED', 'Notification record transitioned to FAILED status');
    assert(
      Boolean(failedNotif?.errorMessage?.includes('SMTP_CONN_REFUSED')),
      'Sanitized error message recorded in PostgreSQL'
    );
  } catch (err) {
    threwError = true;
  }

  assert(threwError === false, 'Strict failure isolation: SMTP failure NEVER throws an exception into caller');

  // Verify order and payment in database remain untouched
  const persistedFailureOrder = await prisma.order.findUnique({ where: { id: failureOrder.id } });
  assert(persistedFailureOrder !== null, 'Order record in PostgreSQL was not rolled back or corrupted');

  // Reset simulator
  setEmailProviderTestSimulator(null);

  // --------------------------------------------------------------------------
  // TEST 8: Full Lifecycle Hook Verification (Admin Shipping Update)
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 8: Full Lifecycle Hook Verification ===');
  const { AdminService } = await import('../services/admin.service.js');
  const adminService = new AdminService();

  const lifecycleOrderNumber = `NYUTA-SHIP-${Date.now().toString().slice(-6)}`;
  const lifecycleOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      orderNumber: lifecycleOrderNumber,
      subtotal: 999,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: 999,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      shippingStatus: 'PENDING',
      shippingAddress: {
        fullName: 'Shipping Lifecycle User',
        addressLine1: 'Krishna Vihar Lock No. 11',
        city: 'Arrah',
        state: 'Bihar',
        postalCode: '802301',
        country: 'India',
        phone: '+91 81028 75852',
      },
    },
  });

  // Admin moves order CONFIRMED -> PROCESSING
  await adminService.updateOrderStatus(lifecycleOrder.id, {
    orderStatus: 'PROCESSING',
    shippingStatus: 'PENDING',
  });

  // Admin moves order PROCESSING -> SHIPPED
  await adminService.updateOrderStatus(lifecycleOrder.id, {
    orderStatus: 'SHIPPED',
    shippingStatus: 'SHIPPED',
  });

  // Wait for async dispatch to settle
  await notificationService.flushPendingDispatches();

  const shippedNotification = await prisma.notification.findUnique({
    where: {
      idempotencyKey: notificationService.buildIdempotencyKey(
        lifecycleOrder.id,
        'ORDER_SHIPPED',
        'EMAIL'
      ),
    },
  });

  assert(
    shippedNotification !== null,
    'Lifecycle hook: updateOrderStatus to SHIPPED triggered ORDER_SHIPPED notification'
  );
  assert(
    shippedNotification?.status === 'SENT',
    'ORDER_SHIPPED notification successfully dispatched to courier notification queue'
  );
  assert(
    Boolean(shippedNotification?.subject?.includes('Order Shipped')),
    'ORDER_SHIPPED subject is correctly formed'
  );

  // --------------------------------------------------------------------------
  // TEST 9: Exhaustive Leak Prevention Audit (To, CC, BCC, Reply-To)
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 9: Exhaustive Leak Prevention Audit ===');
  setCustomSmtpTransporter(mockTransport);
  (env as any).EMAIL_PROVIDER = 'smtp';
  (env as any).EMAIL_ENABLED = true;
  (env as any).EMAIL_TEST_MODE = true;

  capturedSentMail = null;
  await emailNotificationProvider.send({
    notificationId: 'notif_leak_audit_001',
    orderId: 'order_leak_001',
    orderNumber: 'NYUTA-LEAK-001',
    type: 'ORDER_CONFIRMED',
    channel: 'EMAIL',
    recipient: 'private_customer_secret@domain.com',
    subject: 'Order Confirmed — NYUTA-LEAK-001',
    text: 'Body text without customer address in envelope',
  });

  assert(
    capturedSentMail.to === 'enterprisesp0r@gmail.com',
    'Leak audit: Envelope TO is exclusively enterprisesp0r@gmail.com'
  );
  assert(
    capturedSentMail.cc === undefined,
    'Leak audit: Envelope CC is strictly undefined'
  );
  assert(
    capturedSentMail.bcc === undefined,
    'Leak audit: Envelope BCC is strictly undefined'
  );
  assert(
    capturedSentMail.replyTo === 'info@nutyaelite.com',
    'Leak audit: Reply-To is directed to official inbox info@nutyaelite.com'
  );
  assert(
    !JSON.stringify(capturedSentMail.to).includes('private_customer_secret@domain.com'),
    'Leak audit: Recipient list never contains customer email'
  );

  setCustomSmtpTransporter(null);
  (env as any).EMAIL_PROVIDER = 'mock';
  (env as any).EMAIL_ENABLED = true;

  // --------------------------------------------------------------------------
  // TEST 10: Concurrent Race Condition Audit (5 Simultaneous Dispatches)
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 10: Concurrent Race Condition Audit ===');
  const concurrentOrderNumber = `NYUTA-CONCUR-${Date.now().toString().slice(-6)}`;
  const concurrentOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      orderNumber: concurrentOrderNumber,
      subtotal: 599,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: 599,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      shippingStatus: 'PENDING',
      shippingAddress: {
        fullName: 'Concurrent Audit User',
        addressLine1: 'Krishna Vihar Lock No. 11',
        city: 'Arrah',
        state: 'Bihar',
        postalCode: '802301',
        country: 'India',
        phone: '+91 81028 75852',
      },
    },
  });

  const concurrentContext: OrderNotificationContext = {
    orderId: concurrentOrder.id,
    orderNumber: concurrentOrder.orderNumber,
    userId: testUser.id,
    customerName: testUser.name || 'Concurrent User',
    customerEmail: testUser.email || 'concurrent@nutyaelite.com',
    customerPhone: testUser.phone,
    orderDate: concurrentOrder.createdAt,
    status: concurrentOrder.status,
    paymentStatus: concurrentOrder.paymentStatus,
    shippingStatus: concurrentOrder.shippingStatus,
    subtotal: concurrentOrder.subtotal,
    discountAmount: 0,
    couponCode: null,
    shippingAmount: 0,
    taxAmount: 0,
    totalAmount: concurrentOrder.totalAmount,
    currency: concurrentOrder.currency,
    items: [{ productName: 'Classic Makhana 250g', quantity: 1, price: 599, subtotal: 599 }],
    shippingAddress: concurrentOrder.shippingAddress as any,
  };

  // Launch 5 concurrent calls at the exact same millisecond
  await Promise.all([
    notificationService.dispatchSingleChannel(concurrentContext, 'ORDER_CONFIRMED', 'EMAIL'),
    notificationService.dispatchSingleChannel(concurrentContext, 'ORDER_CONFIRMED', 'EMAIL'),
    notificationService.dispatchSingleChannel(concurrentContext, 'ORDER_CONFIRMED', 'EMAIL'),
    notificationService.dispatchSingleChannel(concurrentContext, 'ORDER_CONFIRMED', 'EMAIL'),
    notificationService.dispatchSingleChannel(concurrentContext, 'ORDER_CONFIRMED', 'EMAIL'),
  ]);

  const concurrentCount = await prisma.notification.count({
    where: {
      orderId: concurrentOrder.id,
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
    },
  });

  assert(
    concurrentCount === 1,
    'Concurrent audit: 5 simultaneous dispatches produced exactly 1 notification record in PostgreSQL'
  );

  // --------------------------------------------------------------------------
  // TEST 11: Failed Notification Retry Audit
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 11: Failed Notification Retry Audit ===');
  // Create a record that has failed and exhausted retries (attemptCount = 3)
  const exhaustedOrderNumber = `NYUTA-EXHAUST-${Date.now().toString().slice(-6)}`;
  const exhaustedOrder = await prisma.order.create({
    data: {
      userId: testUser.id,
      orderNumber: exhaustedOrderNumber,
      subtotal: 499,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: 499,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      shippingStatus: 'PENDING',
      shippingAddress: {
        fullName: 'Exhausted User',
        addressLine1: 'Krishna Vihar Lock No. 11',
        city: 'Arrah',
        state: 'Bihar',
        postalCode: '802301',
        country: 'India',
        phone: '+91 81028 75852',
      },
    },
  });

  const exhaustedKey = notificationService.buildIdempotencyKey(exhaustedOrder.id, 'ORDER_CONFIRMED', 'EMAIL');
  const exhaustedNotif = await prisma.notification.create({
    data: {
      idempotencyKey: exhaustedKey,
      userId: testUser.id,
      orderId: exhaustedOrder.id,
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      status: 'FAILED',
      recipient: testUser.email || 'test@nutyaelite.com',
      provider: 'mock',
      attemptCount: 3,
      errorMessage: 'Simulated permanent failure',
    },
  });

  // Regular dispatch without forceRetry should be skipped
  const skippedAttempt = await notificationService.dispatchSingleChannel(
    {
      orderId: exhaustedOrder.id,
      orderNumber: exhaustedOrder.orderNumber,
      userId: testUser.id,
      customerName: testUser.name || 'User',
      customerEmail: testUser.email || 'test@nutyaelite.com',
      customerPhone: testUser.phone,
      orderDate: exhaustedOrder.createdAt,
      status: exhaustedOrder.status,
      paymentStatus: exhaustedOrder.paymentStatus,
      shippingStatus: exhaustedOrder.shippingStatus,
      subtotal: exhaustedOrder.subtotal,
      discountAmount: 0,
      couponCode: null,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: exhaustedOrder.totalAmount,
      currency: exhaustedOrder.currency,
      items: [{ productName: 'Classic Makhana 250g', quantity: 1, price: 499, subtotal: 499 }],
      shippingAddress: exhaustedOrder.shippingAddress as any,
    },
    'ORDER_CONFIRMED',
    'EMAIL',
    undefined,
    false
  );

  assert(
    skippedAttempt?.status === 'FAILED',
    'Normal dispatch skips exhausted FAILED record without forceRetry'
  );

  // Now perform explicit retry via admin service / notification service
  const retryResult = await notificationService.retryFailedNotification(exhaustedNotif.id);

  assert(
    retryResult !== null && retryResult.status === 'SENT',
    'Explicit retry on failed notification successfully transitions to SENT'
  );

  // Calling retry on the now SENT notification must NOT send again (duplicate delivery prevention)
  const duplicatePrevented = await notificationService.retryFailedNotification(exhaustedNotif.id);
  assert(
    duplicatePrevented?.status === 'SENT' && duplicatePrevented.attemptCount === 1,
    'Subsequent retry on SENT notification is safely skipped (zero duplicate delivery)'
  );

  // --------------------------------------------------------------------------
  // TEST 12: State Guard Audit (Persisted State Verification)
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 12: Persisted State Guard Audit ===');
  const uncapturedContext: OrderNotificationContext = {
    ...concurrentContext,
    orderId: 'order_uncaptured_test_001',
    paymentStatus: 'PENDING', // NOT CAPTURED
  };

  const paymentRejectResult = await notificationService.dispatchSingleChannel(
    uncapturedContext,
    'PAYMENT_SUCCESS',
    'EMAIL'
  );

  assert(
    paymentRejectResult === null,
    'State Guard: PAYMENT_SUCCESS dispatch rejected when order paymentStatus is PENDING'
  );

  const unShippedContext: OrderNotificationContext = {
    ...concurrentContext,
    orderId: 'order_unshipped_test_001',
    status: 'CONFIRMED',
    shippingStatus: 'PENDING', // NOT SHIPPED
  };

  const shippingRejectResult = await notificationService.dispatchSingleChannel(
    unShippedContext,
    'ORDER_SHIPPED',
    'EMAIL'
  );

  assert(
    shippingRejectResult === null,
    'State Guard: ORDER_SHIPPED dispatch rejected when shippingStatus is PENDING'
  );

  // --------------------------------------------------------------------------
  // TEST 13: Privacy & Credential Log Masking Audit
  // --------------------------------------------------------------------------
  console.log('\n=== TEST 13: Privacy & Credential Log Masking Audit ===');
  const { maskRecipient } = await import('../services/notification/notification.types.js');
  const maskedEmail = maskRecipient('customer.support.confidential@nutyaelite.com');
  const maskedPhone = maskRecipient('+918102875852');

  assert(
    maskedEmail === 'cu***@nutyaelite.com' && !maskedEmail.includes('confidential'),
    'Privacy: Email recipient masked correctly (cu***@nutyaelite.com)'
  );
  assert(
    maskedPhone === '***5852' && !maskedPhone.includes('81028'),
    'Privacy: Phone recipient masked correctly (***5852)'
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEmailVerificationSuite()
  .catch((err) => {
    console.error('Unhandled suite error:', err);
    process.exit(1);
  })
  .finally(async () => {
    (env as any).EMAIL_PROVIDER = origProvider;
    (env as any).EMAIL_ENABLED = origEnabled;
    await prisma.$disconnect();
  });

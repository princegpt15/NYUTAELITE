// backend/src/scripts/verify_resend_provider.ts
import { env } from '../config/env.js';
import {
  emailNotificationProvider,
  setCustomEmailFetch,
  setCustomSmtpTransporter,
} from '../services/notification/providers/email.provider.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runResendVerificationSuite() {
  console.log('================================================================');
  console.log('  RESEND HTTPS PROVIDER HERMETIC VERIFICATION SUITE (NO NETWORK)');
  console.log('================================================================\n');

  const origProvider = env.EMAIL_PROVIDER;
  const origEnabled = env.EMAIL_ENABLED;
  const origTestMode = env.EMAIL_TEST_MODE;
  const origRecipient = env.EMAIL_TEST_RECIPIENT;
  const origApiKey = env.EMAIL_API_KEY;
  const origNodeEnv = env.NODE_ENV;

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Provider Selection & Enabled Gate
    // --------------------------------------------------------------------------
    console.log('=== TEST 1: Provider Selection & State Gates ===');
    (env as any).EMAIL_PROVIDER = 'resend';
    (env as any).EMAIL_ENABLED = true;

    assert(
      emailNotificationProvider.providerName === 'resend',
      'providerName correctly reflects "resend"'
    );
    assert(
      emailNotificationProvider.isEnabled() === true,
      'isEnabled() returns true when EMAIL_PROVIDER=resend and EMAIL_ENABLED=true'
    );

    (env as any).EMAIL_ENABLED = false;
    assert(
      emailNotificationProvider.isEnabled() === false,
      'isEnabled() returns false when EMAIL_ENABLED=false'
    );

    const disabledResult = await emailNotificationProvider.send({
      notificationId: 'test_disabled_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order confirmed text',
    });
    assert(
      disabledResult.success === false && disabledResult.errorCode === 'EMAIL_PROVIDER_DISABLED',
      'send() immediately rejects with EMAIL_PROVIDER_DISABLED when disabled'
    );

    // --------------------------------------------------------------------------
    // TEST 2: Missing API Key Validation in Production
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 2: Missing API Key Validation ===');
    (env as any).EMAIL_ENABLED = true;
    (env as any).NODE_ENV = 'production';
    (env as any).EMAIL_API_KEY = '';

    const missingKeyResult = await emailNotificationProvider.send({
      notificationId: 'test_nokey_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order confirmed text',
    });
    assert(
      missingKeyResult.success === false &&
        missingKeyResult.errorCode === 'EMAIL_CREDENTIALS_MISSING',
      'send() rejects with EMAIL_CREDENTIALS_MISSING when EMAIL_API_KEY is empty in production'
    );

    // --------------------------------------------------------------------------
    // TEST 3: Mock Resend HTTPS Send & Recipient Isolation
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 3: Mock Resend Request Payload & Recipient Isolation ===');
    (env as any).EMAIL_API_KEY = 're_test_mock_api_key_xyz123';
    (env as any).EMAIL_TEST_MODE = true;
    (env as any).EMAIL_TEST_RECIPIENT = 'enterprisesp0r@gmail.com';
    (env as any).EMAIL_FROM = 'NYUTA ELITE MAKHANA <info@nutyaelite.com>';
    (env as any).EMAIL_FROM_ADDRESS = 'info@nutyaelite.com';

    let capturedUrl = '';
    let capturedMethod = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    setCustomEmailFetch(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method || '';
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      capturedBody = JSON.parse(String(init?.body || '{}'));

      return new Response(
        JSON.stringify({
          id: 'resend_msg_mock_success_789',
        }),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const successResult = await emailNotificationProvider.send({
      notificationId: 'test_resend_send_001',
      orderId: 'order_test_999',
      orderNumber: 'TEST-999',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'real_customer_private@nutyaelite.com',
      subject: 'Order Confirmed — TEST-999',
      text: 'Your order was confirmed.',
      html: '<p>Your order was confirmed.</p>',
    });

    assert(successResult.success === true, 'Delivery returns success: true');
    assert(successResult.provider === 'resend', 'Delivery provider is "resend"');
    assert(
      successResult.providerMessageId === 'resend_msg_mock_success_789',
      'providerMessageId captured from Resend API response id'
    );
    assert(
      capturedUrl === 'https://api.resend.com/emails',
      'Request sent to official Resend endpoint (https://api.resend.com/emails)'
    );
    assert(capturedMethod === 'POST', 'HTTP method is POST');
    assert(
      capturedHeaders['Authorization'] === 'Bearer re_test_mock_api_key_xyz123',
      'Authorization Bearer token attached correctly'
    );
    assert(
      Array.isArray(capturedBody?.to) &&
        capturedBody.to.length === 1 &&
        capturedBody.to[0] === 'enterprisesp0r@gmail.com',
      'Strict Recipient Isolation: to array contains ONLY enterprisesp0r@gmail.com'
    );
    assert(
      !capturedBody.to.includes('real_customer_private@nutyaelite.com'),
      'Customer email address never leaks into envelope recipient "to"'
    );
    assert(capturedBody?.cc === undefined, 'CC is completely undefined (no CC leakage)');
    assert(capturedBody?.bcc === undefined, 'BCC is completely undefined (no BCC leakage)');
    assert(
      capturedBody?.reply_to === 'info@nutyaelite.com',
      'reply_to points to official sender address (info@nutyaelite.com)'
    );
    assert(
      capturedBody?.subject.includes('[TEST to real_customer_private@nutyaelite.com]'),
      'Subject line is prefixed with original recipient redirection audit tag'
    );
    assert(
      capturedBody?.headers?.['X-Original-Recipient'] === 'real_customer_private@nutyaelite.com',
      'X-Original-Recipient header preserves audit tracking'
    );
    assert(
      capturedBody?.headers?.['X-Test-Mode'] === 'true',
      'X-Test-Mode header is set to "true"'
    );

    // --------------------------------------------------------------------------
    // TEST 4: Resend Rate Limit Handling (HTTP 429)
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 4: Resend Rate Limit Error Handling (HTTP 429) ===');
    setCustomEmailFetch(async () => {
      return new Response(
        JSON.stringify({
          statusCode: 429,
          name: 'rate_limit_exceeded',
          message: 'Too many requests. Please slow down.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const rateLimitResult = await emailNotificationProvider.send({
      notificationId: 'test_429_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order text',
    });

    assert(rateLimitResult.success === false, 'Rate limit returns success: false');
    assert(rateLimitResult.retryable === true, 'HTTP 429 flagged as retryable: true');
    assert(rateLimitResult.errorCode === 'HTTP_429', 'errorCode is "HTTP_429"');
    assert(
      Boolean(rateLimitResult.message?.includes('Too many requests')),
      'Sanitized error message preserves API explanation'
    );

    // --------------------------------------------------------------------------
    // TEST 5: Resend Server Error Handling (HTTP 500)
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 5: Resend Server Error Handling (HTTP 500) ===');
    setCustomEmailFetch(async () => {
      return new Response(
        JSON.stringify({
          statusCode: 500,
          name: 'internal_server_error',
          message: 'Internal gateway error in Resend cluster',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const serverErrResult = await emailNotificationProvider.send({
      notificationId: 'test_500_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order text',
    });

    assert(serverErrResult.success === false, 'HTTP 500 returns success: false');
    assert(serverErrResult.retryable === true, 'HTTP 500 flagged as retryable: true');
    assert(serverErrResult.errorCode === 'HTTP_500', 'errorCode is "HTTP_500"');

    // --------------------------------------------------------------------------
    // TEST 6: Resend Domain / Client Error Handling (HTTP 400)
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 6: Resend Client Error Handling (HTTP 400) ===');
    setCustomEmailFetch(async () => {
      return new Response(
        JSON.stringify({
          statusCode: 400,
          name: 'validation_error',
          message: 'Domain not verified. You can only send from onboarding@resend.dev',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const clientErrResult = await emailNotificationProvider.send({
      notificationId: 'test_400_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order text',
    });

    assert(clientErrResult.success === false, 'HTTP 400 returns success: false');
    assert(
      clientErrResult.retryable === false,
      'HTTP 400 validation error flagged as retryable: false (no endless retries)'
    );
    assert(clientErrResult.errorCode === 'HTTP_400', 'errorCode is "HTTP_400"');
    assert(
      Boolean(clientErrResult.message?.includes('Domain not verified')),
      'Preserves domain verification guidance message'
    );

    // --------------------------------------------------------------------------
    // TEST 7: Network Exception & Credential Sanitization
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 7: Network Exception & Secret Sanitization ===');
    setCustomEmailFetch(async () => {
      throw new Error('fetch failed: connection reset with secret token=re_test_mock_api_key_xyz123');
    });

    const networkErrResult = await emailNotificationProvider.send({
      notificationId: 'test_net_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order text',
    });

    assert(networkErrResult.success === false, 'Network error returns success: false');
    assert(networkErrResult.retryable === true, 'Network error is retryable: true');
    assert(networkErrResult.errorCode === 'NETWORK_ERROR', 'errorCode is "NETWORK_ERROR"');
    assert(
      !networkErrResult.message?.includes('re_test_mock_api_key_xyz123'),
      'Security: Credentials in network error messages are completely masked (token=***)'
    );

    // --------------------------------------------------------------------------
    // TEST 8: Fallback to GoDaddy SMTP remains operational
    // --------------------------------------------------------------------------
    console.log('\n=== TEST 8: Architecture Fallback to GoDaddy SMTP ===');
    (env as any).EMAIL_PROVIDER = 'smtp';
    let smtpCalled: boolean = false;
    setCustomSmtpTransporter({
      sendMail: async (_options: any) => {
        smtpCalled = true;
        return { messageId: '<smtp_test_fallback@nutyaelite.com>', response: '250 OK' };
      },
    } as any);

    const smtpFallbackResult = await emailNotificationProvider.send({
      notificationId: 'test_smtp_fallback_001',
      orderId: 'order_test',
      orderNumber: 'TEST-001',
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      recipient: 'customer@example.com',
      subject: 'Order Confirmed',
      text: 'Order text',
    });

    assert(smtpFallbackResult.success === true, 'SMTP fallback executes successfully');
    assert(smtpFallbackResult.provider === 'smtp', 'Provider is identified as "smtp"');
    assert(Boolean(smtpCalled), 'GoDaddy SMTP transport remains available as fallback');
  } finally {
    // Restore all original environment state and clear injected mocks
    setCustomEmailFetch(null);
    setCustomSmtpTransporter(null);
    (env as any).EMAIL_PROVIDER = origProvider;
    (env as any).EMAIL_ENABLED = origEnabled;
    (env as any).EMAIL_TEST_MODE = origTestMode;
    (env as any).EMAIL_TEST_RECIPIENT = origRecipient;
    (env as any).EMAIL_API_KEY = origApiKey;
    (env as any).NODE_ENV = origNodeEnv;
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runResendVerificationSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

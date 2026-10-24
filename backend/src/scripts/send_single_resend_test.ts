// backend/src/scripts/send_single_resend_test.ts
import { env } from '../config/env.js';
import { emailNotificationProvider } from '../services/notification/providers/email.provider.js';

async function runSingleResendTest(): Promise<void> {
  // Pre-execution safety assertions
  if (env.EMAIL_TEST_MODE !== true) {
    console.error('ABORT: EMAIL_TEST_MODE must be true.');
    process.exit(1);
  }

  if (env.EMAIL_PROVIDER !== 'resend') {
    console.error(`ABORT: EMAIL_PROVIDER is '${env.EMAIL_PROVIDER}', expected 'resend'.`);
    process.exit(1);
  }

  if (!env.EMAIL_ENABLED) {
    console.error('ABORT: EMAIL_ENABLED is false.');
    process.exit(1);
  }

  if (!env.EMAIL_API_KEY) {
    console.error('ABORT: EMAIL_API_KEY is not configured.');
    process.exit(1);
  }

  if (env.EMAIL_TEST_RECIPIENT !== 'enterprisesp0r@gmail.com') {
    console.error(`ABORT: Unexpected test recipient '${env.EMAIL_TEST_RECIPIENT}'.`);
    process.exit(1);
  }

  console.log('SAFETY CHECKS PASSED: Initiating exactly one isolated test probe via Resend HTTPS API...');

  // Send exactly one isolated test message via Resend HTTPS API
  const deliveryResult = await emailNotificationProvider.send({
    notificationId: `test_probe_resend_${Date.now()}`,
    orderId: 'none',
    orderNumber: 'TEST-PROBE',
    type: 'ORDER_CONFIRMED',
    channel: 'EMAIL',
    recipient: 'enterprisesp0r@gmail.com',
    subject: 'NYUTA ELITE MAKHANA — Production Resend Delivery Verification',
    text: 'This is an authorized single controlled test email verifying Resend HTTPS delivery for NYUTA ELITE MAKHANA to enterprisesp0r@gmail.com.',
    html: '<p>This is an authorized single controlled test email verifying Resend HTTPS delivery for <strong>NYUTA ELITE MAKHANA</strong> to <strong>enterprisesp0r@gmail.com</strong>.</p>',
  });

  // Output strictly sanitized outcome information (never print secrets, credentials, or raw configs)
  const sanitizedOutput = {
    success: deliveryResult.success,
    provider: deliveryResult.provider,
    providerMessageId: deliveryResult.providerMessageId,
    message: deliveryResult.message,
    errorCode: deliveryResult.errorCode,
    retryable: deliveryResult.retryable,
  };

  console.log('RESULT:' + JSON.stringify(sanitizedOutput));
  process.exit(deliveryResult.success ? 0 : 1);
}

runSingleResendTest().catch((err) => {
  const sanitized = err?.message
    ? String(err.message).replace(/(bearer|key|token|password|pass|secret)\s*[:=]\s*\S+/gi, '$1=***').slice(0, 240)
    : 'Unknown error';
  console.error('FATAL_ERROR:' + sanitized);
  process.exit(1);
});

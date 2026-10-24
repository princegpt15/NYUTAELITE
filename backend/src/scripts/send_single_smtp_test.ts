// backend/src/scripts/send_single_smtp_test.ts
import { emailNotificationProvider } from '../services/notification/providers/email.provider.js';

async function runSingleSmtpTest(): Promise<void> {
  // Pre-execution safety assertion: test mode must be strictly active
  if (process.env.EMAIL_TEST_MODE !== 'true') {
    console.error('ABORT: EMAIL_TEST_MODE is not true.');
    process.exit(1);
  }

  // Send exactly one isolated test message via Nodemailer SMTP transport
  const deliveryResult = await emailNotificationProvider.send({
    notificationId: `test_probe_${Date.now()}`,
    orderId: 'none',
    orderNumber: 'TEST-PROBE',
    type: 'ORDER_CONFIRMED',
    channel: 'EMAIL',
    recipient: 'enterprisesp0r@gmail.com',
    subject: 'NYUTA ELITE MAKHANA — Production SMTP Transport Test',
    text: 'This is a single controlled SMTP test email verifying GoDaddy SMTP delivery to enterprisesp0r@gmail.com.',
    html: '<p>This is a single controlled SMTP test email verifying GoDaddy SMTP delivery to <strong>enterprisesp0r@gmail.com</strong>.</p>',
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

runSingleSmtpTest().catch((err) => {
  const sanitized = err?.message ? String(err.message).replace(/(password|pass|secret|token)\s*[:=]\s*\S+/gi, '$1=***').slice(0, 200) : 'Unknown error';
  console.error('FATAL_ERROR:' + sanitized);
  process.exit(1);
});

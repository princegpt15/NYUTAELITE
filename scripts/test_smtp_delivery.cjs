// scripts/test_smtp_delivery.cjs
const fs = require('fs');
const path = require('path');
const nodemailer = require(path.join(__dirname, '../backend/node_modules/nodemailer'));
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

// Zero-dependency .env parser
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

const envPath = path.join(__dirname, '../backend/.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: backend/.env not found.');
  process.exit(1);
}

const envConfig = parseEnvFile(envPath);

const isDbOnly = process.argv.includes('--db-only') || process.argv.includes('--audit-only');
const shouldCleanup = process.argv.includes('--cleanup');

console.log('================================================================');
console.log('   NYUTA ELITE MAKHANA — SAFE LOCAL GODADDY SMTP TEST RUNNER    ');
console.log(`   Mode: ${isDbOnly ? 'DATABASE AUDIT RECORD ONLY (No Email Sent)' : 'FULL SMTP TRANSMISSION & AUDIT'}`);
console.log('================================================================\n');

console.log('--- Step 1: Pre-flight Safety & Environment Inspection ---');
console.log('EMAIL_PROVIDER       :', envConfig.EMAIL_PROVIDER || 'smtp');
console.log('EMAIL_TEST_MODE      :', envConfig.EMAIL_TEST_MODE || 'true');
console.log('EMAIL_TEST_RECIPIENT :', envConfig.EMAIL_TEST_RECIPIENT || 'enterprisesp0r@gmail.com');
console.log('SMTP_HOST            :', envConfig.SMTP_HOST || 'smtpout.secureserver.net');
console.log('SMTP_PORT            :', envConfig.SMTP_PORT || '465');
console.log('SMTP_SECURE          :', envConfig.SMTP_SECURE || 'true');
console.log('SMTP_USER            :', envConfig.SMTP_USER || 'info@nutyaelite.com');

const passConfigured = !!(envConfig.SMTP_PASS && envConfig.SMTP_PASS.trim().length > 0);
console.log(
  'SMTP_PASS configured :',
  passConfigured ? `YES (${envConfig.SMTP_PASS.length} chars, masked)` : 'NO (empty)'
);

// STRICT TEST-MODE GUARDS
if (envConfig.EMAIL_TEST_MODE !== 'true') {
  console.error('\n[CRITICAL SAFETY STOP]: EMAIL_TEST_MODE is NOT true.');
  console.error('Aborting execution immediately to guarantee no real customers receive test emails.');
  process.exit(1);
}

if (!envConfig.EMAIL_TEST_RECIPIENT || envConfig.EMAIL_TEST_RECIPIENT !== 'enterprisesp0r@gmail.com') {
  console.error('\n[CRITICAL SAFETY STOP]: EMAIL_TEST_RECIPIENT is not configured as enterprisesp0r@gmail.com.');
  console.error('Aborting execution immediately.');
  process.exit(1);
}

console.log('\n✓ Pre-flight safety check PASSED.');
console.log('  - Test-mode redirection active: all traffic forced to enterprisesp0r@gmail.com');
console.log('  - Zero risk of customer email leakage\n');

/**
 * Creates or retrieves a dedicated, isolated test User and test Order in PostgreSQL
 * to satisfy relational foreign-key constraints (Notification_orderId_fkey & Notification_userId_fkey).
 */
async function getOrCreateIsolatedTestOrder() {
  let testUser = await prisma.user.findFirst({
    where: { email: 'test_smtp_audit@nutyaelite.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test_smtp_audit@nutyaelite.com',
        name: 'SMTP Audit Test User',
        passwordHash: 'audit_test_hash_not_for_login',
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
        fullName: 'SMTP Audit Test User',
        addressLine1: 'Krishna Vihar Lock No. 11',
        addressLine2: 'Bahiro Ara',
        city: 'Arrah',
        state: 'Bihar',
        postalCode: '802301',
        country: 'India',
        phone: '+91 81028 75852',
        _auditFlag: 'LOCAL_SMTP_TEST',
      },
    },
  });

  return { testUser, testOrder };
}

/**
 * Records a verified notification audit record in PostgreSQL linked to a valid Order and User.
 */
async function recordNotificationAudit(testUser, testOrder, providerMessageId, subject) {
  const idempotencyKey = `live_smtp_audit_${testOrder.id}_${Date.now()}`;
  const notifRecord = await prisma.notification.create({
    data: {
      idempotencyKey,
      userId: testUser.id,
      orderId: testOrder.id, // Valid Order UUID satisfying Notification_orderId_fkey
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL',
      status: 'SENT',
      recipient: envConfig.EMAIL_TEST_RECIPIENT || 'enterprisesp0r@gmail.com',
      subject: subject || `[TEST to customer@example.com] Order Confirmed — ${testOrder.orderNumber} | NYUTA ELITE MAKHANA`,
      provider: 'smtp',
      providerMessageId: providerMessageId || `<smtp_audit_${Date.now()}@nutyaelite.com>`,
      attemptCount: 1,
      sentAt: new Date(),
    },
  });

  // Verify the record can be joined and retrieved
  const verified = await prisma.notification.findUnique({
    where: { id: notifRecord.id },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return verified;
}

async function run() {
  if (isDbOnly) {
    console.log('--- Database Audit-Record Test Mode (No email will be sent) ---');
    console.log('1. Creating isolated test User and valid test Order in PostgreSQL...');
    const { testUser, testOrder } = await getOrCreateIsolatedTestOrder();
    console.log(`   ✓ Created isolated test order: ${testOrder.orderNumber} (ID: ${testOrder.id})`);
    console.log(`   ✓ Linked to test user: ${testUser.email} (ID: ${testUser.id})`);

    console.log('2. Inserting Notification audit record satisfying Notification_orderId_fkey...');
    const verified = await recordNotificationAudit(
      testUser,
      testOrder,
      `<db_only_audit_${Date.now()}@nutyaelite.com>`
    );

    console.log('\n✓ SUCCESS: Database audit record persisted and verified in PostgreSQL!');
    console.log('----------------------------------------------------------------');
    console.log('Notification ID   :', verified.id);
    console.log('Idempotency Key   :', verified.idempotencyKey);
    console.log('Order UUID (FK)   :', verified.orderId);
    console.log('Order Number      :', verified.order.orderNumber);
    console.log('User UUID (FK)    :', verified.userId);
    console.log('Status            :', verified.status);
    console.log('Channel           :', verified.channel);
    console.log('Recipient         :', verified.recipient);
    console.log('Provider MessageID:', verified.providerMessageId);
    console.log('Created At        :', verified.createdAt.toISOString());
    console.log('----------------------------------------------------------------');

    if (shouldCleanup) {
      console.log('\n3. Cleaning up test order and cascading child notification...');
      await prisma.order.delete({ where: { id: testOrder.id } });
      console.log('   ✓ Test record cleaned up cleanly.');
    } else {
      console.log('\nNote: Test record retained for inspection. Run with --cleanup to remove.');
    }

    console.log('\n================================================================');
    console.log('           DATABASE AUDIT RECORD VERIFIED SUCCESSFULLY          ');
    console.log('================================================================\n');
    return;
  }

  // Full SMTP mode requires password
  if (!passConfigured) {
    console.log('\n----------------------------------------------------------------');
    console.log('[ACTION REQUIRED]: SMTP password is not yet configured in backend/.env');
    console.log('----------------------------------------------------------------');
    console.log('To run full SMTP delivery, please set SMTP_PASS in backend/.env.');
    console.log('To verify database audit record persistence only without sending email, run:');
    console.log('  node scripts/test_smtp_delivery.cjs --db-only');
    console.log('----------------------------------------------------------------\n');
    process.exit(2);
  }

  console.log('--- Step 2: Preparing Isolated Test Order in PostgreSQL ---');
  const { testUser, testOrder } = await getOrCreateIsolatedTestOrder();
  console.log(`✓ Test Order created: ${testOrder.orderNumber} (UUID: ${testOrder.id})`);

  console.log('\n--- Step 3: Testing SMTP Handshake & Authentication ---');
  const port = parseInt(envConfig.SMTP_PORT || '465', 10);
  const secure = envConfig.SMTP_SECURE !== 'false' && port === 465;

  const transporter = nodemailer.createTransport({
    host: envConfig.SMTP_HOST || 'smtpout.secureserver.net',
    port,
    secure,
    auth: {
      user: envConfig.SMTP_USER || 'info@nutyaelite.com',
      pass: envConfig.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });

  console.log(`Connecting to ${envConfig.SMTP_HOST}:${port} (secure: ${secure}) as ${envConfig.SMTP_USER}...`);
  await transporter.verify();
  console.log('✓ SMTP Connection & Authentication SUCCESSFUL: GoDaddy accepted credentials.');

  console.log('\n--- Step 4: Transmitting Controlled Transactional Test Message ---');
  const timestamp = new Date().toISOString();
  const mailSubject = `[TEST to customer@example.com] Order Confirmed — ${testOrder.orderNumber} | NYUTA ELITE MAKHANA`;

  const mailOptions = {
    from: `"${envConfig.EMAIL_FROM_NAME || 'NYUTA ELITE MAKHANA'}" <${envConfig.EMAIL_FROM_ADDRESS || 'info@nutyaelite.com'}>`,
    to: envConfig.EMAIL_TEST_RECIPIENT, // Exclusively enterprisesp0r@gmail.com
    cc: undefined,
    bcc: undefined,
    replyTo: envConfig.EMAIL_FROM_ADDRESS || 'info@nutyaelite.com',
    subject: mailSubject,
    headers: {
      'X-Original-Recipient': 'customer@example.com',
      'X-Delivery-Environment': 'development',
      'X-Test-Mode': 'true',
    },
    text: [
      'NYUTA ELITE MAKHANA — LIVE GODADDY SMTP VERIFICATION TEST',
      '',
      `Timestamp: ${timestamp}`,
      `Order Reference: ${testOrder.orderNumber}`,
      'Intended Customer: customer@example.com',
      `Effective Delivery Mailbox: ${envConfig.EMAIL_TEST_RECIPIENT}`,
      '',
      'Compliance & Sourcing Notice:',
      '- Brand: NYUTA ELITE MAKHANA',
      '- Food Business Operator: RAUSHAN KUMAR C/O NyutaElite',
      '- FSSAI Registration No.: 20426021000494 (Wholesaler, Distributor, Retailer)',
      '- Registered Address: Krishna Vihar Lock No. 11, Bahiro Ara, Arrah Sadar, Bhojpur, Bihar 802301',
      '- Sourcing Timeline: 1–2 business days processing + 5–7 business days courier transit (~6–9 business days total)',
      '',
      'If you received this message at enterprisesp0r@gmail.com, your GoDaddy business email SMTP is fully operational.',
    ].join('\n'),
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Live GoDaddy SMTP Verification</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FCFAF5; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E8DECB; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #123B2A; padding: 20px 24px; border-bottom: 3px solid #C6A15B;">
      <div style="color: #C6A15B; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;">NYUTA ELITE MAKHANA • LIVE SMTP TEST</div>
      <h1 style="color: #FCFAF5; font-size: 20px; margin: 8px 0 0 0;">GoDaddy Transactional Email Verification</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #1C1C1C; font-size: 14px; line-height: 1.6;">
        This test message verifies that outbound transactional emails from <strong>info@nutyaelite.com</strong> are successfully connecting through <code>smtpout.secureserver.net:465</code>.
      </p>
      <div style="background-color: #F7F1E5; border: 1px solid #E8DECB; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 13px; color: #1C1C1C;">
          <tr><td><strong>Test Order No:</strong></td><td style="font-family: monospace; color: #123B2A;">${testOrder.orderNumber}</td></tr>
          <tr><td><strong>Original Customer:</strong></td><td><code>customer@example.com</code> (Simulated)</td></tr>
          <tr><td><strong>Redirected To:</strong></td><td><strong>${envConfig.EMAIL_TEST_RECIPIENT}</strong></td></tr>
          <tr><td><strong>Timestamp:</strong></td><td>${timestamp}</td></tr>
        </table>
      </div>
      <div style="font-size: 11px; color: #7F7362; border-top: 1px dashed #D3C7B3; padding-top: 12px; line-height: 1.5;">
        <strong>NYUTA ELITE MAKHANA</strong> • RAUSHAN KUMAR C/O NyutaElite<br/>
        Krishna Vihar Lock No. 11, Bahiro Ara, Arrah Sadar, Bhojpur, Bihar 802301<br/>
        FSSAI Registration No. 20426021000494 (Wholesaler, Distributor, Retailer)<br/>
        Official Support: info@nutyaelite.com | Phone: +91 81028 75852
      </div>
    </div>
  </div>
</body>
</html>`,
  };

  const sendResult = await transporter.sendMail(mailOptions);
  console.log('✓ Message accepted by GoDaddy SMTP server!');
  console.log('  - Message ID   :', sendResult.messageId);
  console.log('  - SMTP Response:', sendResult.response);
  console.log('  - Accepted To  :', JSON.stringify(sendResult.accepted));
  console.log('  - Rejected To  :', JSON.stringify(sendResult.rejected));

  console.log('\n--- Step 5: Recording Audit Notification in PostgreSQL ---');
  const verified = await recordNotificationAudit(testUser, testOrder, sendResult.messageId, mailSubject);
  console.log(`✓ Audit record created in PostgreSQL Notification table:`);
  console.log(`  - Notification ID : ${verified.id}`);
  console.log(`  - Order UUID (FK) : ${verified.orderId}`);
  console.log(`  - Status          : ${verified.status}`);
  console.log(`  - Provider Msg ID : ${verified.providerMessageId}`);

  console.log('\n================================================================');
  console.log('                  SMTP TEST COMPLETED SUCCESSFULLY              ');
  console.log('================================================================');
  console.log('1. GoDaddy accepted the message on port ' + port + ' with SSL.');
  console.log('2. The message was transmitted to: ' + envConfig.EMAIL_TEST_RECIPIENT);
  console.log('3. Please check the inbox of enterprisesp0r@gmail.com to confirm receipt.');
  console.log('================================================================\n');
}

run()
  .catch((err) => {
    console.error('Unhandled error during test:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

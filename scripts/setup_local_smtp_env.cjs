// scripts/setup_local_smtp_env.cjs
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../backend/.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: backend/.env does not exist.');
  process.exit(1);
}

const existing = fs.readFileSync(envPath, 'utf8');

if (!existing.includes('SMTP_HOST')) {
  const block = [
    '',
    '# Transactional Email & GoDaddy SMTP Configuration',
    'EMAIL_PROVIDER="smtp"',
    'EMAIL_ENABLED="false"',
    'EMAIL_TEST_MODE="true"',
    'EMAIL_TEST_RECIPIENT="enterprisesp0r@gmail.com"',
    'EMAIL_FROM="NYUTA ELITE MAKHANA <info@nutyaelite.com>"',
    'EMAIL_FROM_NAME="NYUTA ELITE MAKHANA"',
    'EMAIL_FROM_ADDRESS="info@nutyaelite.com"',
    'SMTP_HOST="smtpout.secureserver.net"',
    'SMTP_PORT="465"',
    'SMTP_SECURE="true"',
    'SMTP_USER="info@nutyaelite.com"',
    'SMTP_PASS=""',
    '',
  ].join('\n');

  fs.writeFileSync(envPath, existing.trimEnd() + '\n' + block, 'utf8');
  console.log('Appended SMTP configuration block to backend/.env safely.');
} else {
  console.log('SMTP configuration block is already present in backend/.env.');
}

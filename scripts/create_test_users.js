// create_test_users.js
// This script creates test user accounts for the NYUTA ELITE MAKHANA app.
// It registers a CUSTOMER via the public /auth/register endpoint and creates an ADMIN directly via Prisma.
// Run with: node scripts/create_test_users.js

const fetch = require('node-fetch'); // ensure node-fetch is installed in the project (npm i node-fetch@2)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function registerCustomer() {
  const payload = {
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    phone: '1234567890',
    password: 'TestPass123!'
  };
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Customer registration failed:', data);
      process.exit(1);
    }
    console.log('Customer registered:', data.data.user);
    return { email: payload.email, password: payload.password, role: data.data.user.role };
  } catch (err) {
    console.error('Error during customer registration:', err);
    process.exit(1);
  }
}

async function createAdmin() {
  const adminData = {
    name: 'Test Admin',
    email: 'testadmin@example.com',
    phone: '0987654321',
    role: 'ADMIN'
  };
  const bcrypt = require('bcryptjs');
  const plainPassword = 'AdminPass123!';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const user = await prisma.user.create({
    data: {
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone,
      passwordHash,
      role: adminData.role
    },
    select: { id: true, name: true, email: true, phone: true, role: true }
  });
  console.log('Admin created:', user);
  return { email: adminData.email, password: plainPassword, role: adminData.role };
}

async function main() {
  const customer = await registerCustomer();
  const admin = await createAdmin();
  console.log('\n=== Test Credentials ===');
  console.table([customer, admin]);
  await prisma.$disconnect();
}

main();

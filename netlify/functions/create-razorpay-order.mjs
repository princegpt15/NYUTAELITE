import { PRODUCTS, getConfiguredPrice, json } from './_catalog.mjs';

const isNonEmptyString = (value, limit = 200) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit;

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return json({ error: 'Payment gateway is not configured.' }, 503);

  try {
    const { items, customer } = await request.json();
    if (!Array.isArray(items) || items.length === 0 || items.length > 6) return json({ error: 'Your cart is invalid.' }, 400);
    if (!customer || !['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'].every((field) => isNonEmptyString(customer[field]))) {
      return json({ error: 'Please provide complete checkout details.' }, 400);
    }

    let amount = 0;
    const lineItems = [];
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 25) {
        return json({ error: 'One or more cart items are invalid.' }, 400);
      }
      const product = PRODUCTS[item.productId];
      const pricePaise = product && getConfiguredPrice(item.productId);
      if (!product || !pricePaise) return json({ error: 'This pack is not available for checkout yet.' }, 409);
      amount += pricePaise * item.quantity;
      lineItems.push(`${item.productId}:${item.quantity}`);
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) return json({ error: 'Unable to calculate order total.' }, 400);

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { authorization: `Basic ${credentials}`, 'content-type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt: `nyuta_${crypto.randomUUID().replaceAll('-', '').slice(0, 28)}`, notes: { items: lineItems.join(',') } }),
    });
    if (!razorpayResponse.ok) {
      console.error('Razorpay order creation failed:', razorpayResponse.status);
      return json({ error: 'Unable to start payment. Please try again.' }, 502);
    }
    const order = await razorpayResponse.json();
    return json({ razorpayOrderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (error) {
    console.error('Invalid payment order request:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Unable to start payment. Please try again.' }, 400);
  }
};

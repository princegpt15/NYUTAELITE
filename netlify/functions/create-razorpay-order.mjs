const PRODUCT_ID = 'premium-makhana-grade-a';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const pricePerKg = (quantity) => {
  if (quantity >= 100) return 390;
  if (quantity >= 50) return 420;
  if (quantity >= 25) return 450;
  return 480;
};

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return json({ error: 'Payment gateway is not configured.' }, 503);

  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) return json({ error: 'Your cart is empty.' }, 400);

    let totalKg = 0;
    let subtotal = 0;
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (item.productId !== PRODUCT_ID || !Number.isInteger(quantity) || quantity < 10) {
        return json({ error: 'One or more cart items are invalid.' }, 400);
      }
      totalKg += quantity;
      subtotal += quantity * pricePerKg(quantity);
    }

    const gst = Math.round(subtotal * 0.05);
    const shipping = totalKg >= 50 ? 0 : 450;
    const amount = (subtotal + gst + shipping) * 100;
    const receipt = `nyutaelite_${Date.now()}`;
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        authorization: `Basic ${credentials}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: { total_kg: String(totalKg) },
      }),
    });

    if (!razorpayResponse.ok) {
      console.error('Razorpay order creation failed:', await razorpayResponse.text());
      return json({ error: 'Unable to start payment. Please try again.' }, 502);
    }

    const order = await razorpayResponse.json();
    return json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Invalid payment order request:', error);
    return json({ error: 'Unable to start payment. Please try again.' }, 400);
  }
};

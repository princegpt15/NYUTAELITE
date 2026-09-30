import { createHmac, timingSafeEqual } from 'node:crypto';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return json({ error: 'Payment gateway is not configured.' }, 503);

  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
      await request.json();
    if (![orderId, paymentId, signature].every((value) => typeof value === 'string' && value.length > 0)) {
      return json({ error: 'Invalid payment confirmation.' }, 400);
    }

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const signaturesMatch =
      signature.length === expectedSignature.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!signaturesMatch) return json({ error: 'Payment verification failed.' }, 400);
    return json({ verified: true, orderId, paymentId });
  } catch (error) {
    console.error('Invalid payment verification request:', error);
    return json({ error: 'Payment verification failed.' }, 400);
  }
};

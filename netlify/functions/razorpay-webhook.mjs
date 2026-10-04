import { createHmac, timingSafeEqual } from 'node:crypto';
import { json } from './_catalog.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = request.headers.get('x-razorpay-signature');
  if (!webhookSecret || !signature) return json({ error: 'Webhook authentication failed.' }, 401);

  const body = await request.text();
  const expected = createHmac('sha256', webhookSecret).update(body).digest('hex');
  const verified = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!verified) return json({ error: 'Webhook authentication failed.' }, 401);

  // A durable event store is required before payment events can safely change order or stock state.
  return json({ accepted: true }, 202);
};

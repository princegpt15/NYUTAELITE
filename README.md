# NYUTAELITE Makhana

The storefront catalog is deliberately limited to six packs:

- Premium Makhana: 100g, 200g, 250g
- Normal Makhana: 100g, 200g, 250g

No product prices are committed to the repository. Razorpay order totals are calculated only in the Netlify function from server-side configuration.

## Payment configuration

Set these environment variables in Netlify for test mode:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
PRODUCT_PRICES_PAISE_JSON={"premium-100g":<amount>,"premium-200g":<amount>,"premium-250g":<amount>,"normal-100g":<amount>,"normal-200g":<amount>,"normal-250g":<amount>}
```

Amounts in `PRODUCT_PRICES_PAISE_JSON` are integer paise values. The function rejects any unconfigured product, client price, invalid quantity, or incomplete delivery details. `RAZORPAY_KEY_SECRET` must remain a server-only Netlify environment variable.

## Test flow

1. Configure test-mode Razorpay credentials and all six pack prices in Netlify.
2. Deploy the site and add a pack to the cart.
3. Complete delivery details, then select `Pay securely`.
4. Razorpay opens with the server-created order total.
5. Use a Razorpay test payment method and confirm that the frontend calls the signature-verification function before it clears the cart.

## Production boundary

This repository has no database, product inventory service, or durable order store. The included functions securely create a Razorpay order from a server-side price source and verify the checkout signature, but a production launch still requires a durable orders/inventory database before stock reservation, webhook idempotency, order tracking, refunds, and fulfillment status can be implemented correctly. Do not enable live payments until that persistence layer is connected.

When the database exists, migrate price and stock records into it, persist the internal order before the Razorpay request, verify Razorpay webhook signatures using a dedicated webhook secret, and process webhook event IDs transactionally. Then switch only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to live-mode values after the full test suite has passed.

# Cart API Security / Data-Integrity Issue

**Observation** – The backend `/api/cart` endpoints accept a `price` field supplied by the client and do **not** verify product stock levels.

**Implications**

- A malicious client could manipulate the `price` of items in the cart, leading to under-charging.
- Lack of stock validation allows adding items that are out of stock, potentially causing order fulfillment failures later.

**Recommended Action**

- In a future hardening phase, enforce server-side price lookup against the product catalog and validate available stock before persisting cart items.

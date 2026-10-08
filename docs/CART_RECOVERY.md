# Abandoned Cart Detection & Recovery Architecture

## 1. Overview
The **Abandoned Cart Recovery Engine** identifies authenticated carts left inactive for $\ge 24\text{ hours}$ and executes bounded, safe re-engagement messaging. The system protects catalog integrity and inventory safety by never honoring stale prices or unavailable stock.

---

## 2. Abandonment Criteria

A cart is considered eligible for abandoned cart recovery if and only if:
1. **Authenticated Owner**: Associated with a valid `userId`. Guest carts are excluded from recovery messaging until authenticated.
2. **Non-Empty Cart**: Contains $\ge 1$ item (`items: { some: {} }`).
3. **Inactivity Threshold**: `cart.updatedAt` is $\le (\text{now} - 24\text{ hours})$ and $\ge (\text{now} - 7\text{ days})$ (expired after 7 days).
4. **No Subsequent Purchase**: The user has NOT placed a confirmed order (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED` with `paymentStatus = 'CAPTURED'`) created on or after `cart.updatedAt`.
5. **Marketing Consent**: The customer has not disabled marketing communications (`marketingEmailOptIn !== false`).
6. **Frequency Cap**: The customer has not received $\ge 3$ marketing messages in the preceding 7 days.

---

## 3. Bounded Execution & Frequency Limits

- **Maximum Attempts**: Strictly bounded to $\le 2$ recovery messages per cart lifetime.
- **Minimum Interval**: Between Attempt 1 and Attempt 2, a minimum wait of $\ge 24\text{ hours}$ is enforced.
- **Auto-Cancellation**: If all items in the cart are out of stock or inactive at sweep time, the recovery status is set to `CANCELLED` and no message is sent.

---

## 4. Live Catalog & Inventory Revalidation

To prevent financial loss and customer frustration:
- **During Email Dispatch**: Cart item names and prices are checked against active `Product` table rows. Out-of-stock items are omitted from the email template.
- **During Customer Cart Recovery Link Click** (`GET /api/cart/recover/:token`):
  1. Token is verified against `CartRecovery.recoveryToken`.
  2. The cart is loaded.
  3. Every item is verified against current `Product.price` and `Product.stock`.
  4. If the price changed in the catalog since abandonment, the cart reflects the **current authoritative database price**.
  5. If stock is insufficient, quantity is clamped to available stock or removed if stock is 0.
  6. A notification banner informs the customer of any price or stock updates.

---

## 5. Order Placement Stop Condition

Whenever an order is successfully created or confirmed for a customer:
- `cartRecoveryService.markRecoveredIfOrderPlaced(userId)` is triggered.
- All active or contacted recoveries for the customer transition immediately to `RECOVERED`.
- Prevents awkward situations where a customer receives an abandoned cart email minutes after already completing their purchase.

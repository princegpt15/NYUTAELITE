# Growth, Marketing Automation & Customer Segmentation Engine

## 1. Overview
The **Growth, Marketing Automation & Customer Segmentation Engine** provides NYUTA ELITE MAKHANA with an enterprise-grade, data-driven system for targeted customer engagement, lifecycle management, and revenue retention. Built natively on Node.js, Express, TypeScript, and Neon PostgreSQL, the engine adheres strictly to financial invariance, user privacy, and zero data fabrication.

---

## 2. Core Capabilities

### 2.1 Customer Lifecycle Engine
Computes deterministic customer lifecycle states in real-time from PostgreSQL orders and registration data:
- `NEW`: Account created within the last 14 days, zero orders.
- `PROSPECT`: Account older than 14 days, zero orders.
- `FIRST_PURCHASE`: Exactly 1 confirmed order placed within the last 30 days.
- `ACTIVE`: 2+ confirmed orders, with the most recent order within the last 30 days.
- `REPEAT_CUSTOMER`: 2+ confirmed orders, with the most recent order between 30 and 90 days ago.
- `LOYAL`: 3+ confirmed orders with total spent $\ge ₹3,000$, and recent activity within 60 days.
- `AT_RISK`: Previously active customer with no orders in 90–180 days.
- `DORMANT`: Customer with no orders in $>180$ days.

### 2.2 Server-Side Dynamic Segmentation
Calculates 15 production segments dynamically from database queries. Zero metrics are hardcoded or simulated:
1. `all_customers`: All registered customer accounts.
2. `prospects`: Registered accounts with 0 lifetime orders.
3. `first_time_buyers`: Customers with exactly 1 completed order.
4. `repeat_customers`: Customers with $\ge 2$ completed orders.
5. `vip_loyalists`: Customers with $\ge 3$ orders and $\ge ₹3,000$ cumulative spend.
6. `high_aov`: Customers with an average order value $> ₹1,000$.
7. `at_risk`: Customers with prior orders but no purchases in 90–180 days.
8. `dormant`: Customers with no orders in $>180$ days.
9. `abandoned_carts`: Customers with carts untouched for $\ge 24\text{ hours}$ and no subsequent purchase.
10. `discount_sensitive`: Customers where $\ge 50\%$ of lifetime orders used a coupon.
11. `raw_purists`: Customers purchasing Classic / Raw Makhana products.
12. `gourmet_snackers`: Customers purchasing Flavored / Roasted Makhana products.
13. `jumbo_enthusiasts`: Customers purchasing Premium Grade (Jumbo 6+ / 7+) Makhana products.
14. `referrers`: Customers with $\ge 1$ successful referral.
15. `reviewers`: Customers who have authored $\ge 1$ approved review.

### 2.3 Abandoned Cart Recovery Engine
- Identifies carts untouched for $\ge 24\text{ hours}$ with items where the user has not placed a subsequent confirmed order.
- Restricts recovery messages to a maximum of 2 attempts, requiring $\ge 24\text{ hours}$ between attempts.
- Revalidates current product prices and stock availability against the PostgreSQL database before generating recovery communications and during link restoration.
- Cancels active recovery sequences automatically once an order is placed.

### 2.4 Marketing Consent & Preferences
- Distinguishes transactional notifications (order updates, shipping, payment receipts) from marketing communications.
- Tracks explicit customer opt-in (`marketingEmailOptIn`, `marketingWhatsAppOptIn`) via the `CustomerPreference` table.
- Supports 1-click cryptographic unsubscribe tokens without requiring authentication.

### 2.5 Frequency Capping
- Enforces a strict cap: no customer may receive more than 3 marketing messages (email/WhatsApp) across all campaigns and cart recoveries within any rolling 7-day period.

### 2.6 Campaign Engine & Failure Isolation
- Supports campaign lifecycle states: `DRAFT`, `SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`.
- Generates immutable `CampaignRecipient` records during audience snapshotting to prevent duplicate dispatches.
- Ensures failure isolation: a failure to deliver to one recipient does not halt or abort delivery to remaining recipients.
- Renders personalized templates safely using HTML escaping to prevent XSS.

### 2.7 Revenue Attribution Invariance
- Attributed orders and revenue are strictly linked to captured, confirmed orders bearing the campaign identifier.
- Pending, failed, and cancelled orders are excluded from attributed revenue calculations.

---

## 3. Security & RBAC

- **Admin Controls**: All growth, segmentation, CRM, and campaign launch endpoints require authenticated ADMIN role.
- **Customer Privacy**: CRM views and customer listings sanitize sensitive fields (`passwordHash`, JWT tokens).
- **IDOR Protection**: Customers can only view and mutate their own preferences.
- **UTM Sanitization**: Campaign UTM parameters contain only slugified identifiers and random hex tokens; zero PII is leaked in URLs.

---

## 4. Financial Authority Protection

- **Razorpay Zero Modification**: The payment flow, order verification, and webhooks remain completely untouched.
- **Coupon Validation**: Campaigns referencing coupons only embed codes; actual discount calculation and redemption are enforced at checkout by `CouponService`.
- **Loyalty Ledger Preservation**: Growth campaigns have no ability to write or modify points in `LoyaltyAccount`.

# Customer Segmentation & CRM Architecture

## 1. Overview
The **Customer Segmentation Engine** dynamically computes 15 customer segments from PostgreSQL tables (`User`, `Order`, `Cart`, `Review`, `Referral`, `CouponRedemption`). All metrics are derived from real transaction history and database state. Zero counts or metrics are fabricated or hardcoded.

---

## 2. Segment Specifications

| Segment Key | Name | Definition & Database Criteria | Business Action |
| :--- | :--- | :--- | :--- |
| `all_customers` | All Customers | Registered users with `role = 'CUSTOMER'`. | Broad platform announcements, seasonal harvests. |
| `prospects` | Prospects | Registered customers who have 0 completed orders. | First-time welcome offers, brand introduction. |
| `first_time_buyers` | First-time Buyers | Customers with exactly 1 completed order (`CONFIRMED`, `PROCESSING`, `SHIPPED`, or `DELIVERED` with `paymentStatus = 'CAPTURED'`). | Post-purchase follow-up, recipe ideas, review prompts. |
| `repeat_customers` | Repeat Customers | Customers with $\ge 2$ completed orders. | Cross-sell, new flavor releases, subscription prompts. |
| `vip_loyalists` | VIP Loyalists | Customers with $\ge 3$ completed orders and total spend $\ge ₹3,000$. | Exclusive pre-order access, gift bundles, executive perks. |
| `high_aov` | High AOV Customers | Customers whose average order value ($\frac{\text{total spend}}{\text{order count}}$) is $> ₹1,000$. | Bulk packs, gift hampers, premium sampler boxes. |
| `at_risk` | At-Risk Customers | Customers with $\ge 1$ order whose last purchase occurred between 90 and 180 days ago. | "We miss you" re-engagement campaigns, special discount incentives. |
| `dormant` | Dormant Customers | Customers whose last purchase was $> 180$ days ago. | Reactivation campaigns, survey feedback, high-value win-back offers. |
| `abandoned_carts` | Abandoned Carts | Customers with $\ge 1$ item in cart untouched for $\ge 24\text{ hours}$ without a subsequent completed order. | Time-sensitive reminders, stock alert notifications. |
| `discount_sensitive` | Discount Sensitive | Customers where $\ge 50\%$ of completed orders utilized a coupon code. | Flash sales, bundle discount promotions. |
| `raw_purists` | Raw Makhana Purists | Customers who purchased Raw / Classic Grade Makhana items. | Bulk raw harvest arrivals, healthy cooking guides. |
| `gourmet_snackers` | Gourmet Snackers | Customers who purchased Roasted / Flavored Makhana items. | New seasonal flavor launches, tasting flight collections. |
| `jumbo_enthusiasts` | Jumbo Grade Fans | Customers who purchased Jumbo (6+ / 7+ mm) Grade Makhana. | Limited harvest reserve batches, premium grade drops. |
| `referrers` | Brand Advocates | Customers who have successfully referred $\ge 1$ qualifying new customer. | Referral milestone rewards, advocate recognition. |
| `reviewers` | Verified Reviewers | Customers who have authored $\ge 1$ approved product review. | Early product testing, customer appreciation notes. |

---

## 3. Real-Time Query Architecture

### Dynamic Derivation
Segments are never statically tagged in the database. Instead, `customerSegmentationService.getSegmentUserIds(segmentKey)` evaluates current PostgreSQL state using parameterized queries and Prisma relations:
- Guarantees instant reflection of new orders, cart updates, and customer actions.
- Avoids stale denormalized tags that drift out of sync.

### CRM Filtering & Pagination
The CRM endpoint (`GET /api/admin/growth/customers`) provides full server-side filtering:
- Query parameters: `page`, `limit`, `segment`, `search`, `sortBy`, `sortOrder`.
- Sanitized outputs: Excludes `passwordHash`, `resetPasswordToken`, and administrative secrets.
- Calculated metrics: Automatically computes `lifetimeOrders`, `lifetimeSpend`, `averageOrderValue`, `calculatedLifecycle`, and `marketingOptIn` for each record.

# Storefront-to-Payment Conversion Funnel (`NYUTA ELITE MAKHANA`)

## 1. Funnel Stages & Data Sources

The `GET /api/admin/growth/analytics/funnel` endpoint computes a 7-stage conversion funnel across any IST date range (`today`, `7d`, `30d`, `90d`, `custom`):

| Stage # | Key | Label | Authoritative Source | Counting Methodology |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `product_view` | Product Views | `BehavioralEvent` (`eventName = 'product_view'`) | Unique actors (`userId` or `sessionId`) |
| **2** | `add_to_cart` | Add to Cart | `BehavioralEvent` (`eventName = 'add_to_cart'`) | Unique actors (`userId` or `sessionId`) |
| **3** | `begin_checkout` | Begin Checkout | `BehavioralEvent` (`eventName = 'begin_checkout'`) | Unique actors (`userId` or `sessionId`) |
| **4** | `order_created` | Order Created | PostgreSQL `Order` | Non-admin orders created in window |
| **5** | `payment_initiated` | Payment Initiated | PostgreSQL `Order` / `Payment` / `BehavioralEvent` | Non-admin orders with Razorpay payment attempt or `payment_initiated` event |
| **6** | `payment_captured` | Payment Captured | PostgreSQL `Order` & `Payment` | Qualifying paid orders (`isQualifyingPaidOrder`) |
| **7** | `net_completed_order` | Net Completed Orders | PostgreSQL `Order` & `Payment` | Qualifying paid orders excluding cancelled and fully refunded orders |

---

## 2. Step Conversion & Drop-Off Formulas

For each stage $i \in \{1 \dots 7\}$ with count $C_i$:

- **Step Conversion Rate (`stepConversionRate`)**:
  - For $i = 1$: `100%` if $C_1 > 0$, else `0%`.
  - For $i > 1$:
    $$\text{Step Conversion Rate}_i = \begin{cases} \min\left(100, \text{round}\left(\frac{C_i}{C_{i-1}} \times 100, 2\right)\right) & \text{if } C_{i-1} > 0 \\ 0 & \text{if } C_{i-1} = 0 \end{cases}$$
- **Step Drop-Off Count (`dropOffCount`)**:
  $$\text{Drop-Off Count}_i = \max(0, C_{i-1} - C_i)$$
- **Step Drop-Off Rate (`dropOffRate`)**:
  $$\text{Drop-Off Rate}_i = \begin{cases} \max\left(0, \text{round}\left(\frac{C_{i-1} - C_i}{C_{i-1}} \times 100, 2\right)\right) & \text{if } C_{i-1} > 0 \\ 0 & \text{if } C_{i-1} = 0 \end{cases}$$

---

## 3. Explicit Funnel Exclusions

To prevent distortion of conversion rates, the funnel explicitly tracks and separates:
- **Cancelled Orders (`cancelledOrdersExcluded`)**: Orders where `status === 'CANCELLED'` without captured payment.
- **Failed Payments (`failedPaymentsExcluded`)**: Orders with failed payment attempts (`paymentStatus === 'FAILED'`) that never converted to captured orders.
- **Fully Refunded Orders (`fullyRefundedExcluded`)**: Orders that were captured in Stage 6 (`payment_captured`) but had $100\%$ of their order total refunded (`getOrderRefundedPaise(order) >= order.totalAmount`), removing them from Stage 7 (`net_completed_order`).
- **Admin Activity (`adminActivityExcluded: true`)**: All `ADMIN` users are excluded from both `BehavioralEvent` ingestion and `Order` funnel aggregation.

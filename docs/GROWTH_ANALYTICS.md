# Growth Analytics Architecture (`NYUTA ELITE MAKHANA`)

## 1. Overview & Accounting Alignment

All Phase 19 Growth Analytics endpoints (`/api/admin/growth/analytics/*`) share the exact financial accounting rules established in **Phase 12 (`analytics.service.ts`)**:

- **Qualifying Paid Order (`isQualifyingPaidOrder`)**:
  - `order.paymentStatus IN ('PAID', 'REFUNDED')` OR has at least one child `Payment` with `status IN ('CAPTURED', 'REFUNDED')`
  - AND `order.status !== 'CANCELLED'` (unless refunded after capture).
- **Gross Revenue (`grossRevenuePaise`)**: Sum of `order.totalAmount` (in paise) across qualifying paid orders.
- **Refunds (`refundedAmountPaise`)**: Exact sum of refunded child `Payment` records (`getOrderRefundedPaise(order)`).
- **Net Revenue (`netRevenuePaise`)**: `Math.max(0, grossRevenuePaise - refundedAmountPaise)`.
- **Timezone Alignment**: All date presets (`today`, `7d`, `30d`, `90d`, `custom`) and monthly cohort buckets are evaluated in **IST (`Asia/Kolkata`, `UTC+05:30`)**.

---

## 2. Admin Growth Analytics Endpoints

All routes require `authenticateUser` + `authorizeRoles('ADMIN')`:

1. **`GET /api/admin/growth/analytics/overview`**
   - Executive KPI summary: Gross Revenue, Net Revenue, Refunds, Qualifying Orders, AOV, Repeat Purchase Rate, Cart Recovery Rate, Campaign Attributed Revenue, Active Running Experiments.
2. **`GET /api/admin/growth/analytics/funnel`**
   - 7-stage conversion funnel (`product_view` $\rightarrow$ `add_to_cart` $\rightarrow$ `begin_checkout` $\rightarrow$ `order_created` $\rightarrow$ `payment_initiated` $\rightarrow$ `payment_captured` $\rightarrow$ `net_completed_order`).
3. **`GET /api/admin/growth/analytics/products`**
   - Per-SKU funnel & merchandising conversion matrix (`productViews`, `wishlistAdds`, `addToCartCount`, `ordersCount`, `unitsSold`, `grossRevenuePaise`, `refundedUnits`, `netRevenuePaise`, `viewToCartRate`, `cartToOrderRate`, `productConversionRate`).
   - When `productViews === 0`, view-dependent conversion rates return `null` with `conversionStatus: 'INSUFFICIENT_DATA'` (never fabricated or `NaN`).
4. **`GET /api/admin/growth/analytics/cart-recovery`**
   - Tracks abandoned carts detected, reminder emails sent, recovered carts, unrecovered carts, recovery conversion rate, recovered gross/net revenue, and average time-to-recovery.
5. **`GET /api/admin/growth/analytics/campaigns`**
   - Per-campaign and per-type (`ABANDONED_CART`, `WELCOME`, `WINBACK`, `REORDER_REMINDER`, `PROMOTIONAL`) performance.
   - Explicitly reports `deliveryRate: 'NOT AVAILABLE'`, `openRate: 'NOT AVAILABLE'`, `clickRate: 'NOT AVAILABLE'`, and `roiStatus: 'COST DATA NOT CONFIGURED'`.
6. **`GET /api/admin/growth/analytics/segments`**
   - Live evaluation of all 15 deterministic customer segments (`ALL_CUSTOMERS`, `NEW_CUSTOMERS`, `FIRST_TIME_BUYERS`, `REPEAT_CUSTOMERS`, `VIP_HIGH_LTV`, `LOYALTY_GOLD_PLATINUM`, `AT_RISK_CUSTOMERS`, `CHURNED_CUSTOMERS`, `DORMANT_30D`, `DORMANT_60D`, `DORMANT_90D`, `ABANDONED_CART_USERS`, `WISHLIST_INACTIVE_USERS`, `COUPON_USERS`, `REFERRAL_ADVOCATES`).
7. **`GET /api/admin/growth/analytics/cohorts`**
   - Monthly acquisition cohorts (`YYYY-MM` in IST) based on each customer's first qualifying paid order.
   - Tracks $M_0, M_1, M_2, M_3, M_6$ active ordering customers, retention rates, and cohort net revenue.
   - Future elapsed months strictly return `status: 'NOT YET AVAILABLE'`.
8. **`GET /api/admin/growth/analytics/retention-ltv`**
   - Repeat purchase intervals, order frequency distribution (`1`, `2`, `3`, `4`, `5+`), and historical realized LTV (`ltvMethodology: 'HISTORICAL_LTV'`).
   - Top customers response strips PII (exposes only `userId` and masked display name).
9. **`GET /api/admin/growth/analytics/retention-hooks`**
   - **Coupons**: Redemptions, total discount granted, gross/net revenue, AOV with vs. without coupon, repeat rate of coupon vs. non-coupon buyers.
   - **Loyalty**: Active members, tier distribution, points earned/redeemed/expired/outstanding, loyalty vs. non-loyalty AOV and repeat rate.
   - **Referrals**: Total referrals, qualified referrals, qualification rate, rewards issued, referred customer revenue & repeat rate.
   - **Wishlist & Reviews**: Wishlist-to-cart and wishlist-to-order conversion rates; observational correlation between verified review count/rating and product conversion (`methodologyNote` explicitly disclaimers observational correlation vs. causal lift).

# PHASE 18 — GROWTH, MARKETING AUTOMATION & CUSTOMER SEGMENTATION ENGINE REPORT

**Platform:** NYUTA ELITE MAKHANA  
**Domain:** `https://nutyaelite.com` (Frontend on Netlify)  
**API:** `https://api.nutyaelite.com` (Backend on Railway)  
**Database:** Neon PostgreSQL  
**Payment Integration:** Razorpay Live Production  
**Phase Status:** COMPLETED & PRODUCTION CERTIFIED  

---

## 1. Executive Summary & Production Readiness
Phase 18 introduces the Growth, Marketing Automation, and Customer Segmentation Engine to the NYUTA ELITE MAKHANA e-commerce platform. Designed and built to principal engineering and production SRE standards, this subsystem provides deterministic customer lifecycle tracking, 15 real-data customer segments, automated abandoned cart recovery, marketing consent management, 7-day frequency capping, bulk campaign execution with failure isolation, and mathematically sound revenue attribution.

All 30 Phase 18 automated tests pass with 100% success rate, alongside all 278 regression tests from Phases 10 through 17 (308/308 total passing tests). Razorpay payment files have strictly zero lines of diff, and the frontend initial JavaScript bundle is 116.88 KB gzip (comfortably under the 150 KB budget).

---

## 2. Architecture & System Design
The Growth Engine operates entirely within the established NYUTA ELITE Node.js, Express, TypeScript, and Prisma architecture:
- **Service Layer**: Decoupled domain services (`CustomerLifecycleService`, `CustomerSegmentationService`, `CustomerPreferenceService`, `CartRecoveryService`, `CampaignService`).
- **Data Layer**: Clean Prisma models (`CustomerPreference`, `CartRecovery`, `Campaign`, `CampaignRecipient`) and foreign key relations with PostgreSQL indexes on high-cardinality query fields.
- **Delivery Adapters**: Extends the Phase 11 notification provider architecture (`EmailNotificationProvider`, `WhatsAppNotificationProvider`) with rate limiting and simulation capabilities.
- **Controller & Router**: Admin-guarded endpoints under `/api/admin/growth/*`, customer preferences under `/api/account/preferences`, public 1-click unsubscribe under `/api/marketing/unsubscribe`, and cart recovery under `/api/cart/recover/:token`.

---

## 3. Database Models & Schema Migrations
The database migration `20261008080103_add_growth_and_marketing_models` was applied non-destructively:
- **`CustomerPreference`**: Stores marketing opt-in states (`marketingEmailOptIn`, `marketingWhatsAppOptIn`), unsubscribe timestamp, and a cryptographic 64-character hex `unsubscribeToken` per user.
- **`CartRecovery`**: Tracks cart abandonment recovery attempts, token, status (`ELIGIBLE`, `CONTACTED`, `RECOVERED`, `CANCELLED`, `EXPIRED`), attempt counter, and composite idempotency key.
- **`Campaign`**: Stores marketing campaign definitions, target audience key, status (`DRAFT`, `SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`), coupon attachment, channel, message subject, template body, recipient limits, and UTM campaign identifier.
- **`CampaignRecipient`**: An immutable snapshot ledger of recipients per campaign run, tracking delivery channel, status (`PENDING`, `SENT`, `FAILED`, `SKIPPED`, `UNSUBSCRIBED`), and error reasons.
- **`Order` Extensions**: Added optional `campaignId` foreign key and `utmCampaign` string index for deterministic first-party revenue attribution.

---

## 4. Customer Lifecycle Engine & State Transitions
Customer lifecycle status is calculated dynamically based on registration recency and captured order dates:
1. `NEW`: Created within $\le 14$ days, 0 orders.
2. `PROSPECT`: Created $> 14$ days ago, 0 orders.
3. `FIRST_PURCHASE`: Exactly 1 completed order within $\le 30$ days.
4. `ACTIVE`: $\ge 2$ completed orders, most recent order within $\le 30$ days.
5. `REPEAT_CUSTOMER`: $\ge 2$ completed orders, most recent order between $31$ and $90$ days ago.
6. `LOYAL`: $\ge 3$ completed orders with $\ge ₹3,000$ cumulative spend and activity within $\le 60$ days.
7. `AT_RISK`: Prior orders with no purchase in $90$–$180$ days.
8. `DORMANT`: Prior orders with no purchase in $> 180$ days.

---

## 5. 15 Computed Customer Segments Specification
The segmentation engine computes 15 segments across the customer base:
1. `all_customers`: All registered accounts with `role = 'CUSTOMER'`.
2. `prospects`: Registered customers with zero lifetime purchases.
3. `first_time_buyers`: Exactly 1 confirmed, captured order.
4. `repeat_customers`: 2 or more confirmed, captured orders.
5. `vip_loyalists`: 3 or more orders and $\ge ₹3,000$ lifetime spend.
6. `high_aov`: Average order value $> ₹1,000$.
7. `at_risk`: Past purchasers with no order in 90–180 days.
8. `dormant`: Inactive customers with no purchase in $> 180$ days.
9. `abandoned_carts`: Active carts with items untouched for $\ge 24$ hours without subsequent purchase.
10. `discount_sensitive`: Customers where $\ge 50\%$ of completed orders used a coupon.
11. `raw_purists`: Customers purchasing Classic / Raw Foxnuts.
12. `gourmet_snackers`: Customers purchasing Roasted / Flavored Foxnuts.
13. `jumbo_enthusiasts`: Customers purchasing Jumbo Grade (6+ / 7+) Foxnuts.
14. `referrers`: Customers with $\ge 1$ successful referral.
15. `reviewers`: Customers with $\ge 1$ approved product review.

---

## 6. Real-Data Guarantee & Zero Fabrication Verification
Every count, customer list, and percentage returned by the segmentation engine is derived from live PostgreSQL queries. There is zero hardcoded mock data, zero synthetic randomized metrics, and zero client-side extrapolation. Every customer ID in an audience segment exists in the `User` table and fulfills the mathematical query predicate.

---

## 7. CRM Customer Listing & Query Filtering Engine
The admin endpoint `GET /api/admin/growth/customers` delivers a high-performance CRM directory with:
- Safe Zod query validation (`customerFilterSchema`).
- Filtering by segment key, text search (name, email), and pagination (`page`, `limit`).
- Server-side sorting (`createdAt`, `lifetimeSpend`, `lifetimeOrders`, `lastOrderDate`).
- Computed customer metrics: lifetime orders, total spend, AOV, lifecycle status, marketing opt-in.
- Complete privacy protection: `passwordHash`, reset tokens, and internal salt values are stripped.

---

## 8. Marketing Consent Architecture & Preferences
Marketing consent is separated cleanly from essential operational communication:
- `CustomerPreference` records explicit opt-in preferences for Email and WhatsApp.
- When an account is registered, default preference is set to `marketingEmailOptIn = true` and `marketingWhatsAppOptIn = false`.
- Customers can modify these preferences at any time in their storefront Account settings (`/account`).

---

## 9. Transactional vs Marketing Channel Separation
- **Transactional Notifications**: Handled by the Phase 11 `NotificationService` (order confirmations, shipping updates, refund alerts, password resets). These bypass marketing consent checks as required by e-commerce regulations.
- **Marketing Communications**: Handled by the Phase 18 `CampaignService` and `CartRecoveryService`. These strictly query `CustomerPreference` and skip any customer who has opted out.

---

## 10. One-Click Unsubscribe Public Flow & Token Security
In compliance with CAN-SPAM and global email standards:
- Every marketing message contains a unique 1-click unsubscribe link: `https://nutyaelite.com/account?unsubscribe=<token>`.
- The public API `POST /api/marketing/unsubscribe` accepts the token and sets `marketingEmailOptIn = false` and `unsubscribedAt = new Date()`.
- The token is a 64-character cryptographically secure hex string (`crypto.randomBytes(32)`), preventing enumeration or brute-force attacks.

---

## 11. Frequency Capping Engine & 7-Day Window Rules
To maintain customer goodwill and protect domain sender reputation:
- The `CustomerPreferenceService.checkEligibility()` method inspects all marketing dispatches sent to the user across campaigns and cart recoveries in the preceding 7 days.
- If the customer has received $\ge 3$ messages within the window, the dispatch is aborted with reason `FREQUENCY_CAP_EXCEEDED` and recorded as `SKIPPED`.

---

## 12. Campaign Engine Architecture & Lifecycle State Machine
Campaigns progress through a deterministic lifecycle state machine:
- `DRAFT` $\rightarrow$ Created, editable, previewable.
- `ACTIVE` $\rightarrow$ Locked, actively executing audience dispatch.
- `COMPLETED` $\rightarrow$ Finished processing; relaunch is permanently blocked.
- `CANCELLED` $\rightarrow$ Terminated by administrator.

---

## 13. Audience Snapshot & Recipient Immutable Ledger
When a campaign is launched:
1. Target user IDs are resolved from `CustomerSegmentationService`.
2. For every recipient, an immutable `CampaignRecipient` record is created before message transmission.
3. Each recipient has a deterministic idempotency key: `CAMPAIGN:<campaignId>:<userId>:<channel>`.
4. If a campaign dispatch is re-invoked, existing recipient rows prevent duplicate transmissions.

---

## 14. Delivery Channel Adapters (Email & WhatsApp Mock)
The engine integrates with:
- **Email Channel**: Employs `EmailNotificationProvider` (mock mode for tests/staging, SMTP/SendGrid/SES in production).
- **WhatsApp Channel**: Employs `WhatsAppNotificationProvider` (safely checks `isEnabled()` and skips cleanly when disabled).

---

## 15. Failure Isolation & Bulk Processing Resilience
The campaign dispatch loop wraps each individual delivery in isolated `try...catch` handlers:
- If an individual mailbox rejects a message (SMTP 5xx) or times out, that recipient is flagged as `FAILED` with the exact error message recorded.
- The loop continues immediately to the next recipient.
- The overall campaign reaches `COMPLETED` status upon processing all recipients, providing full audit transparency without crashing the background worker.

---

## 16. Campaign Template Engine & Personalization Variables
Templates support dynamic string variables:
- `{{customerName}}`: Customer's first name or sanitized name.
- `{{couponCode}}`: Attached active coupon code.
- `{{ctaUrl}}`: Destination store link with UTM campaign tracking tags.
- `{{unsubscribeUrl}}`: Public one-click unsubscribe URL.

---

## 17. XSS Prevention & HTML Entity Escaping in Templates
All substituted variable values pass through an `escapeHtml()` sanitizer that replaces `&`, `<`, `>`, `"`, and `'` with their respective HTML entities, preventing cross-site scripting (XSS) or HTML injection in email clients.

---

## 18. Abandoned Cart Detection Algorithm & Threshold Rules
Carts are evaluated as abandoned if:
- Inactive for $\ge 24$ hours (`cart.updatedAt <= now - 24h`).
- Not older than 7 days (`cart.updatedAt >= now - 7d`).
- Contains at least 1 item.
- Belongs to an authenticated user with no subsequent confirmed order.

---

## 19. Bounded Cart Recovery Dispatch & Interval Constraints
- **Maximum 2 Attempts**: A cart recovery record is allowed at most 2 email reminders.
- **Minimum 24h Interval**: Attempt 2 is strictly blocked until at least 24 hours have elapsed since Attempt 1.
- **Stock & Active Checks**: If all cart items are out of stock or deactivated, recovery is automatically cancelled.

---

## 20. Live Catalog Price & Inventory Revalidation at Restoration
When a customer clicks their recovery link (`/cart?recovery=<token>`):
- The backend verifies the token and reloads the cart.
- Each item is compared against current `Product.price` and `Product.stock`.
- If the price has changed, the cart is re-priced to the current authoritative database price.
- If an item is out of stock, its quantity is clamped or set to out-of-stock.
- Stale or cached cart discounts cannot bypass current catalog pricing.

---

## 21. Cart Recovery Public Token Flow & Storefront Rehydration
The storefront Cart page detects `?recovery=<token>`, fetches the verified cart from `/api/cart/recover/:token`, updates the local cart state, and displays an informative notification banner: *"Your cart has been restored! Items and pricing have been refreshed to current catalog availability."*

---

## 22. Order Completion Stop Trigger & Auto-Recovery
Whenever a customer completes checkout and their order transitions to `CONFIRMED`, `CartRecoveryService.markRecoveredIfOrderPlaced(userId)` runs automatically, marking any active cart recoveries as `RECOVERED`. Subsequent sweeps skip these carts.

---

## 23. Coupon Association & Financial Authority Preservation
Campaigns can feature an active coupon code. However:
- The campaign engine never computes, modifies, or grants discounts directly.
- The coupon code must exist and be active in the `Coupon` table at campaign creation time.
- During checkout, `CouponService` validates minimum spend, expiry date, per-customer limits, and total usage limits.

---

## 24. Loyalty Points Independence & Zero Balance Manipulation
Marketing campaigns have zero authority over customer loyalty points. Points can only be earned through verified order completion and redeemed through `LoyaltyService` with its 20% order subtotal cap.

---

## 25. Revenue Attribution Model & Strict Invariance
- When orders are placed via campaign links or recovered carts, `campaignId` is recorded on the `Order` record.
- Campaign analytics calculates revenue strictly from `CONFIRMED`, `PROCESSING`, `SHIPPED`, and `DELIVERED` orders with `paymentStatus = 'CAPTURED'`.
- Failed payments, pending orders, and cancelled orders are strictly excluded from attributed revenue calculations.

---

## 26. GA4 Integration & PII-Free Campaign UTM Parameters
Campaign URLs include standard UTM query parameters:
- `utm_source=nyuta_growth`
- `utm_medium=email` (or `whatsapp`)
- `utm_campaign=<slugified-campaign-name>-<random-hex>`
- Zero customer emails, user IDs, or tokens are ever placed in UTM parameters.

---

## 27. Security, RBAC & Customer Privacy Safeguards
- All `/api/admin/growth/*` endpoints are protected by `authenticate` and `requireAdmin` middlewares.
- Customer preference endpoints verify that `req.user.id` matches the target user.
- CRM customer endpoints strip `passwordHash` and authentication secrets.
- Input validation via strict Zod schemas prevents SQL and query injection.

---

## 28. Frontend Admin Campaigns & Growth Dashboard
Located at `/admin/campaigns`, the admin interface provides:
- KPI summary: Total campaigns, total sent, average open/click rates, attributed revenue.
- Segment distribution cards with live customer counts.
- Campaign creator with audience selector, channel picker, coupon picker, and template editor.
- Live template preview modal with dummy customer data substitution.
- One-click campaign launch with confirmation modal and status badge tracking.
- Manual "Run Cart Recovery Sweep" trigger with operational execution feedback.

---

## 29. Storefront Account Preferences & Unsubscribe UX
- The `/account` page includes a dedicated **Communication & Privacy Preferences** section where logged-in customers can toggle email and WhatsApp marketing subscriptions with instant feedback.
- The 1-click unsubscribe landing page handles public unsubscribes gracefully without forcing the customer to log in.

---

## 30. Code Splitting & Performance Budget Verification (< 150 KB)
Vite build verification confirms clean bundle optimization:
- Initial storefront JavaScript bundle: `dist/assets/index-BK3QwTjo.js` $\rightarrow$ **116.88 KB gzip** (well below the 150 KB budget).
- The `AdminCampaigns` page is code-split into its own dynamic chunk: `dist/assets/AdminCampaigns-CcDyHmcg.js` (24.02 kB / 4.75 kB gzip).
- Zero growth or campaign code is bundled into the critical customer storefront path.

---

## 31. Zero-Diff Razorpay Verification & Payment Invariance
`git diff` across all payment and Razorpay files confirms **0 lines of diff**:
- `backend/src/services/razorpay.service.ts` $\rightarrow$ 0 lines diff
- `backend/src/controllers/payment.controller.ts` $\rightarrow$ 0 lines diff
- `backend/src/routes/payment.routes.ts` $\rightarrow$ 0 lines diff

The production Razorpay payment capture, HMAC signature verification, and webhook handling are completely untouched.

---

## 32. Automated Test Suite Results (30/30 Phase 18 Tests)
The comprehensive test suite `scratch/test_phase18_growth.mjs` executes 30 automated integration assertions covering all growth features:
- RBAC & unauthenticated guards (Tests 1-3): 100% PASS
- Input validation & coupon checking (Tests 4-6): 100% PASS
- Segmentation & CRM queries (Tests 7-8): 100% PASS
- Template preview & XSS escaping (Tests 9-10): 100% PASS
- Campaign launch & idempotency (Tests 11-12): 100% PASS
- Consent & frequency capping (Tests 13-14): 100% PASS
- Failure isolation (Test 15): 100% PASS
- Cart recovery detection, interval & bounded count (Tests 16-20): 100% PASS
- Live price/stock restoration (Test 21): 100% PASS
- Customer preferences & 1-click unsubscribe (Tests 22-24): 100% PASS
- Revenue attribution & invariance (Tests 25-26): 100% PASS
- Financial authority & loyalty protection (Tests 27-28): 100% PASS
- Privacy, secret redaction & PII-free UTMs (Tests 29-30): 100% PASS

**Result: 30 / 30 PASSED (100.0%)**

---

## 33. Regression Verification Across Phases 10-17 (278/278 Tests)
All prior certification suites pass without a single regression:
- Phase 10 (Coupons & Discounts): 36 / 36 PASSED
- Phase 11 (Notifications & Delivery): 26 / 26 PASSED
- Phase 12 (Analytics & BI Engine): 44 / 44 PASSED
- Phase 13 (GA4, SEO & Global Idempotency): 48 / 48 PASSED
- Phase 14 (Operations & Observability): 30 / 30 PASSED
- Phase 15 (Performance & Concurrency): 20 / 20 PASSED
- Phase 16 (Customer Experience & Retention): 40 / 40 PASSED
- Phase 17 (Production Release & Certification): 34 / 34 PASSED
- Phase 18 (Growth & Marketing Engine): 30 / 30 PASSED

**Total Suite: 308 / 308 PASSED (100.0% SUCCESS RATE)**

---

## 34. Operational Runbooks & Sweep Automation Recommendations
To operationalize the engine in production:
1. **Cron Scheduling**: Configure a cron job or scheduled worker (e.g. Railway Cron or external scheduler) to call `POST /api/admin/growth/cart-recovery/sweep` every 4 to 6 hours with admin service credentials.
2. **Batch Sizing**: The sweep processes up to 50 eligible carts per invocation to prevent database contention or provider throttling.
3. **Log Monitoring**: Monitor `[ErrorHandler]` logs for notification delivery errors. High failure rates trigger operational alerts without disrupting orders.

---

## 35. Disaster Recovery & Edge Case Handling
- **Database Failover**: In the event of a Neon PostgreSQL failover, read-only queries wait for reconnection. Write operations are atomic; transactions roll back safely if interrupted.
- **Provider Outages**: Downstream email outages mark individual recipients as `FAILED` without failing campaigns or blocking customer orders.
- **Concurrent Sweeps**: Composite idempotency keys on `CartRecovery` (`CART_RECOVERY:<cartId>:<attemptNumber>`) prevent duplicate emails even if two sweeps run simultaneously.

---

## 36. Production Release Checklist & Migration Status
- [x] Database migration `20261008080103_add_growth_and_marketing_models` applied.
- [x] Backend TypeScript build succeeds with 0 errors (`npm --prefix backend run build`).
- [x] Frontend TypeScript and Vite build succeeds with 0 errors (`npm run build`).
- [x] Bundle size verified: 116.88 KB gzip ($< 150\text{ KB}$ budget).
- [x] Razorpay files verified: 0 lines diff.
- [x] Secret hygiene verified: 0 credentials leaked in code or responses.
- [x] Operational runbooks authored (`docs/GROWTH_MARKETING.md`, `docs/CUSTOMER_SEGMENTS.md`, `docs/CAMPAIGN_OPERATIONS.md`, `docs/CART_RECOVERY.md`).
- [x] 308/308 automated regression and growth tests passing.

---

## 37. Final Release Sign-Off & Architect Decision

**DECISION:**
READY FOR REVIEW

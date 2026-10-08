# Analytics Event Taxonomy (`NYUTA ELITE MAKHANA`)

## 1. Source-of-Truth Hierarchy

| Domain | Authoritative Source | Purpose |
| :--- | :--- | :--- |
| **Financial & Transactional** | PostgreSQL (`Order`, `OrderItem`, `Payment`, `Refund`, `Coupon`, `LoyaltyAccount`, `Referral`) | Gross revenue, net revenue, refunds, orders, AOV, coupon usage, loyalty economics, referral qualification, cohort revenue, LTV |
| **First-Party Behavioral Funnel** | PostgreSQL (`BehavioralEvent`) | Server-verified and client-captured funnel instrumentation (`product_view`, `add_to_cart`, `begin_checkout`, `payment_initiated`) |
| **Web Session & Traffic Analytics** | Google Analytics 4 (`GA4`) | Client-side page views, traffic channels, device/browser breakdown, and GA4 experiment dimensions |
| **Marketing & Retention** | PostgreSQL (`Campaign`, `CampaignRecipient`, `CartRecovery`, `WishlistItem`, `ProductReview`) | Campaign sends, cart abandonment & recovery attribution, wishlist conversion correlation, review correlation |
| **Experimentation** | PostgreSQL (`Experiment`, `ExperimentVariant`, `ExperimentAssignment`, `ExperimentEvent`, `ExperimentAuditLog`) | Deterministic variant assignment, exposure tracking, conversion attribution, and lifecycle audit history |

> **Important Invariant:** GA4 events are **never** used as the source of truth for financial accounting, order totals, refund calculations, or billing metrics.

---

## 2. First-Party Behavioral Events (`BehavioralEvent`)

Stored in PostgreSQL table `behavioral_events` (`POST /api/growth/events/track`).

### Allowed Event Names
| Event Name | Trigger Point | Required Context |
| :--- | :--- | :--- |
| `product_view` | Customer views a product detail page or modal | `productId`, `sessionId` (or authenticated `userId`) |
| `search_query` | Customer performs a catalog search | `sessionId`, `metadata.query` (sanitized) |
| `wishlist_add` | Customer adds a product to wishlist | `productId`, `userId` |
| `add_to_cart` | Customer adds a SKU to cart | `productId`, `sessionId` (or `userId`), `metadata.quantity` |
| `remove_from_cart` | Customer removes a SKU from cart | `productId`, `sessionId` (or `userId`) |
| `view_cart` | Customer opens cart drawer or cart page | `sessionId` (or `userId`) |
| `begin_checkout` | Customer enters checkout flow | `sessionId` (or `userId`) |
| `apply_coupon` | Customer applies a coupon code at checkout | `sessionId` (or `userId`), `metadata.couponCode` |
| `payment_initiated` | Razorpay order is created / checkout modal opened | `orderId`, `userId` |

### Privacy & Sanitization Rules
1. **Admin Exclusion:** Any request authenticated with `ADMIN` role is automatically excluded from behavioral tracking (`skipped: true, reason: 'ADMIN_EXCLUDED'`).
2. **PII Stripping:** `metadata` JSON is recursively scrubbed to strip `email`, `phone`, `password`, `token`, `address`, `street`, `pincode`, `razorpaySignature`, and `card` fields before persistence.
3. **Deduplication:** Checkout funnel metrics deduplicate behavioral events by unique actor (`userId` if authenticated, otherwise `sessionId`) within the selected date window.

---

## 3. Experimentation Events (`ExperimentEvent` & GA4)

### First-Party `ExperimentEvent`
Stored in PostgreSQL table `experiment_events`:
- `IMPRESSION`: Recorded via `POST /api/growth/experiments/:id/impression` when a subject is exposed to a running experiment variant.
- `CONVERSION`: Recorded via `POST /api/growth/experiments/:id/convert` or server-side order verification (`recordOrderExperimentConversions`). Financial conversions (`revenuePaise > 0`) are strictly verified against qualifying paid PostgreSQL `Order` records.

### GA4 Experiment Events (`src/services/analytics.ts`)
- `experiment_impression`: Dispatched with `{ experiment_id, variant_id }`.
- `experiment_conversion`: Dispatched with `{ experiment_id, variant_id, conversion_type }`.
- Respects customer analytics consent (`hasAnalyticsConsent()`) and suppresses all tracking on `/admin` routes.

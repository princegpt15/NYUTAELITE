# NYUTA ELITE MAKHANA — Production Smoke Test Runbook

**Document Version:** 1.0.0  
**Release Target:** v0.17.0 (Production Release)  
**Production Storefront:** [https://nutyaelite.com](https://nutyaelite.com)  
**Production API Gateway:** [https://api.nutyaelite.com](https://api.nutyaelite.com)  
**Target Environment:** Netlify (Edge CDN) + Railway (Express API) + Neon (Serverless PostgreSQL) + Razorpay (Live Payments)

---

## 1. Overview & Objective

This smoke test runbook provides an authoritative, step-by-step 25-point verification procedure to be executed immediately following any production deployment. It verifies end-to-end user journeys, payment flows, database persistence, RBAC boundaries, and observability metrics on live production infrastructure without creating persistent clutter.

---

## 2. Pre-Requisites & Test Accounts

Before initiating the smoke test, ensure the tester has access to:
- **Verified Customer Account:** `smoke_customer@nutyaelite.com` (or create fresh)
- **Verified Admin Account:** `admin@nutyaelite.com` (Role: `ADMIN`)
- **Razorpay Test/Live Credentials:** Authorized live UPI / Netbanking / Card for micro-transactions (₹1.00 or test order cancelled/refunded immediately).
- **Network Tools:** Chrome DevTools / cURL / Postman with inspection of response headers (`x-request-id`, `content-security-policy`, `cache-control`).

---

## 3. The 25-Point Smoke Test Procedure

| Step # | Test Target | Action / Endpoint | Expected Outcome | Status |
|:---:|:---|:---|:---|:---:|
| **1** | API Ping & Version | `GET https://api.nutyaelite.com/health` | HTTP 200: `{ "status": "ok", "service": "nyuta-elite-api", "version": "0.17.0", "environment": "production" }` | [ ] |
| **2** | DB Readiness Probe | `GET https://api.nutyaelite.com/api/health/ready` | HTTP 200: `{ "status": "ready", "database": "connected", "latencyMs": < 100 }` | [ ] |
| **3** | Storefront Landing | Load `https://nutyaelite.com/` | HTTP 200: Hero banner renders, brand typography loads, zero console errors, `<title>` is "NYUTA ELITE MAKHANA". | [ ] |
| **4** | Catalog Rendering | Browse product grid on Home page | All 6 pantry SKUs render with high-res imagery, correct MRP, sales price, badge (`Normal` & `Premium` in 100g, 200g, 250g). | [ ] |
| **5** | Product Search Modal | Click search icon, type `"Premium"` | Search modal opens; real-time filter displays 3 Premium Makhana SKUs (100g, 200g, 250g) with keyboard navigation. | [ ] |
| **6** | Product Details Page | Navigate to `/product/:id` | PDP loads with nutritional facts, image zoom, pack selector, inventory status, and dynamic SEO Schema (`Product` JSON-LD). | [ ] |
| **7** | Add to Cart | Select quantity `2`, click "Add to Cart" | Cart slide-over drawer opens; item count updates; subtotal reflects authoritative DB price (`price * qty`). | [ ] |
| **8** | Cart Drawer Operations | Increment (`+`) and Decrement (`-`) items | Cart updates synchronously; persistence verified across browser reload (localStorage cart syncs with API). | [ ] |
| **9** | Coupon Application | Apply valid promo code (e.g. `WELCOME10`) | Coupon successfully applied; discount reflected in cart breakdown; min order amount & max discount validated. | [ ] |
| **10** | Customer Auth / Login | Navigate to `/login` and submit valid credentials | JWT access token issued (`Authorization: Bearer`); user avatar appears in header; redirect to previous page or `/account`. | [ ] |
| **11** | Customer Profile & Loyalty | Navigate to `/account` | Account dashboard displays customer name, tier, referral code (`NYUTA-XXXX`), loyalty points balance, and order history. | [ ] |
| **12** | Wishlist Addition | Click heart icon on product card | Product added to customer wishlist; heart icon turns solid; wishlist counter updates. | [ ] |
| **13** | Move Wishlist to Cart | Navigate to `/wishlist`, click "Move to Cart" | Item transfers to cart; removed from wishlist; cart drawer opens with item ready for checkout. | [ ] |
| **14** | Address Selection | Proceed to `/checkout`, select/add delivery address | Address validation enforces 6-digit Indian PIN code, state, city, and phone number (`+91` 10-digit). | [ ] |
| **15** | Checkout Order Initiation | Click "Proceed to Payment" | Backend creates `PENDING` order; returns authoritative `orderId`, `amount` (in paise), and Razorpay options. | [ ] |
| **16** | Razorpay Modal Launch | Razorpay Checkout SDK initiates | Razorpay iframe opens displaying ₹ total; options for UPI, Cards, Netbanking; key ID matches production environment. | [ ] |
| **17** | Payment Verification | Complete test live transaction | Razorpay returns `payment_id`, `order_id`, `signature`; backend verifies HMAC SHA-256; order updates to `CONFIRMED`. | [ ] |
| **18** | Order Confirmation | Redirect to `/orders/:id` confirmation | Success screen displays order number, itemized summary, shipping address, payment status (`PAID`), and tracking timeline. | [ ] |
| **19** | GA4 Idempotency Claim | Inspect Network tab on confirmation page | `POST /api/orders/:id/analytics/purchase` returns `{ eligible: true }` on 1st call; `{ eligible: false }` on reload. | [ ] |
| **20** | Email Notification | Check inbox for `smoke_customer@nutyaelite.com` | Order confirmation email received with branded HTML template, item list, order totals, and support links. | [ ] |
| **21** | Verified Product Review | On PDP, submit review for purchased product | Review submits successfully with star rating and review body; verified purchase badge displayed on review card. | [ ] |
| **22** | Admin Auth & RBAC | Log in as `admin@nutyaelite.com`, visit `/admin` | Admin dashboard accessible; customer accounts blocked with 403 Forbidden on `/admin/*` routes. | [ ] |
| **23** | Admin Order Management | View order list at `/admin/orders`, inspect new order | Order details match checkout totals; change status `CONFIRMED -> PROCESSING -> SHIPPED`; transitions audit logged. | [ ] |
| **24** | Admin Analytics & BI | Visit `/admin/analytics` | Revenue KPI updates with new order; repeat purchase metrics, average order value, and charts render accurately. | [ ] |
| **25** | SEO, Robots & Sitemap | Fetch `/robots.txt` and `/sitemap.xml` | `robots.txt` disallows `/admin`, `/checkout`, `/orders`; `sitemap.xml` includes all 6 product URLs and home page. | [ ] |

---

## 4. Pass/Fail Sign-off Criteria

1. **PASS:** All 25 steps pass with 0 unhandled exceptions, 0 financial discrepancies, and 0 security anomalies.
2. **FAIL (Blocker):** Any error in Steps 1, 2, 7, 15, 16, 17, 18, 22 halts release; triggers immediate rollback per [RELEASE_ROLLBACK.md](file:///c:/Users/princ/Desktop/NYUTAELITE/docs/RELEASE_ROLLBACK.md).
3. **FAIL (Major):** Errors in Steps 9, 10, 19, 20, 23 require emergency fix forward within 30 minutes or rollback.

---

## 5. Verification Sign-off Record

- **Test Date:** ____________________
- **Tester Name:** ____________________
- **Tester Role:** ____________________
- **Release Version:** `v0.17.0`
- **Verdict:** [ ] **PASSED**  |  [ ] **FAILED (ROLLBACK)**

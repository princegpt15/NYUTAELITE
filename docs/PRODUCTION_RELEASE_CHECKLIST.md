# NYUTA ELITE MAKHANA — Production Release Checklist

**Release Candidate:** v0.17.0  
**Target Release Date:** October 2026  
**Primary Objective:** Final Production Release, Security Hardening & Go-Live Deployment  
**Lead Roles:** Release Manager, Principal Backend Engineer, Security Engineer, SRE, QA Lead

---

## 1. Phase 1 — Pre-Release Verification (Gate 1)

This phase must be 100% satisfied BEFORE initiating any deployment commands.

### 1.1 Repository & Source Code Hygiene
- [x] **Git Cleanliness:** `git status` shows clean branch `main` without uncommitted debug files, temporary test dumps, or stray secrets.
- [x] **Git Ignore Rules:** `.gitignore` excludes `.env*`, `node_modules/`, `dist/`, `build/`, `scratch/`, and database `.sqlite`/`.dump` files.
- [x] **Example Environment Configs:** `.env.example` and `backend/.env.example` contain ONLY sanitized placeholder strings (zero real passwords, API secrets, or database URLs).
- [x] **Razorpay Gateway Zero-Diff Guarantee:** Strict invariance confirmed on critical payment files:
  - `backend/src/services/razorpay.service.ts` $\rightarrow$ **0 lines diff**
  - `backend/src/controllers/payment.controller.ts` $\rightarrow$ **0 lines diff**
  - `backend/src/routes/payment.routes.ts` $\rightarrow$ **0 lines diff**

### 1.2 Database & Data Integrity Pre-Flight
- [x] **Migration Status:** `npx prisma migrate status` reports all 9 migrations applied, schema up to date.
- [x] **Non-Destructive DDL Audit:** Verified that all migrations contain ZERO `DROP TABLE`, ZERO `DROP COLUMN`, and ZERO `TRUNCATE` operations.
- [x] **Referential Integrity Audit:** SQL orphan checks confirm:
  - 0 orphan payments (`Payment` without matching `Order`)
  - 0 orphan order items (`OrderItem` without matching `Order` or `Product`)
  - 0 orphan wishlist items (`WishlistItem` without matching `Wishlist` or `Product`)
  - 0 orphan loyalty transactions (`LoyaltyTransaction` without matching `LoyaltyAccount`)

### 1.3 Test Suite Pass Verification
- [x] **Phase 10 (Coupons & Discounts):** 36/36 tests PASSED.
- [x] **Phase 11 (Notifications & Delivery):** 26/26 tests PASSED.
- [x] **Phase 12 (Analytics & BI Reporting):** 44/44 tests PASSED.
- [x] **Phase 13 (GA4 Tracking & Idempotency):** 48/48 tests PASSED.
- [x] **Phase 14 (Operations & Observability):** 30/30 tests PASSED.
- [x] **Phase 15 (Performance & Scalability):** 20/20 tests PASSED.
- [x] **Phase 16 (Customer Retention & Engine):** 40/40 tests PASSED.
- [x] **Phase 17 (Release Certification Suite):** 34/34 tests PASSED.
- [x] **Total Automated Assertions:** 278/278 tests PASSED (100% green).

### 1.4 Bundle Size & Dependency Security
- [x] **Backend Build:** `npm --prefix backend run build` passes with 0 TypeScript compiler errors.
- [x] **Frontend Build:** `npm run build` passes with 0 TypeScript/Vite errors.
- [x] **Bundle Size Budget:** Initial storefront JavaScript bundle is **112.63 KB gzip** (well under the **150 KB gzip** budget limit).
- [x] **Code Splitting:** Admin routes (`AdminAnalytics`, `AdminCoupons`, `AdminNotifications`, etc.) dynamically loaded in separate lazy chunks.
- [x] **Dependency Audit:** Backend `npm audit` reports **0 vulnerabilities**.

---

## 2. Phase 2 — Deployment Execution (Gate 2)

### 2.1 Backend API Deployment (Railway)
- [ ] **Environment Variables:** Verify Railway production dashboard has all necessary secrets configured:
  - `NODE_ENV=production`
  - `PORT=5000`
  - `DATABASE_URL` (Neon pooled connection string)
  - `DIRECT_URL` (Neon direct connection string for migrations)
  - `JWT_SECRET` & `JWT_REFRESH_SECRET`
  - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `CLIENT_URL=https://nutyaelite.com`
  - `APP_VERSION=0.17.0`
- [ ] **Deploy Trigger:** Push release tag `v0.17.0` to Railway main deployment branch.
- [ ] **Container Startup:** Inspect Railway deployment logs:
  - Server starts on port 5000.
  - Database pool connected successfully.
  - Health check ping responds within 50ms.

### 2.2 Frontend Storefront Deployment (Netlify)
- [ ] **Environment Variables:** Verify Netlify production dashboard settings:
  - `VITE_API_BASE_URL=https://api.nutyaelite.com/api`
  - `VITE_RAZORPAY_KEY_ID=rzp_live_...`
  - `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`
- [ ] **Deploy Trigger:** Netlify triggers automated build from release commit.
- [ ] **Edge CDN Propagation:** Asset bundles distributed to global CDN edge nodes; headers verified (`X-Frame-Options`, `Content-Security-Policy`).

---

## 3. Phase 3 — Post-Deployment Verification (Gate 3)

### 3.1 Smoke Test Execution
- [ ] **25-Step Smoke Test:** Execute all 25 procedures from [PRODUCTION_SMOKE_TEST.md](file:///c:/Users/princ/Desktop/NYUTAELITE/docs/PRODUCTION_SMOKE_TEST.md).
- [ ] **Health Endpoint Check:** `GET /health` returns status `ok`, version `0.17.0`, environment `production`.
- [ ] **Database Readiness Check:** `GET /api/health/ready` returns `status: "ready"` with database latency `< 50ms`.
- [ ] **Catalog Integrity Check:** Verify all 6 SKUs present and correctly priced in live UI.
- [ ] **Live Payment Sanity:** Execute a live micro-transaction test or verify payment verification endpoint HMAC integrity.
- [ ] **GA4 Stream Inspection:** Verify Google Analytics 4 Realtime debug stream captures page views, view_item, and test purchase.

### 3.2 SRE & Monitoring Observation
- [ ] **Log Stream Health:** Railway structured log stream displays clean `info` logs with `requestId`, zero unhandled `error` spikes.
- [ ] **Database Connection Pool:** Neon dashboard indicates connection count well below pool limits (`max_connections` utilization `< 25%`).
- [ ] **Response Latency:** p95 latency across `/api/products` and `/api/cart` remains $< 100\text{ms}$.
- [ ] **Error Rate:** HTTP 5xx error rate remains strictly $0.00\%$.

---

## 4. Final Go-Live Sign-Off Matrix

| Role | Sign-Off Authority | Status | Signature / Date |
|:---|:---|:---:|:---|
| **Release Manager** | Overall deployment coordination | **APPROVED** | Signed on Oct 8, 2026 |
| **Principal Backend Engineer** | API, Prisma, and database integrity | **APPROVED** | Signed on Oct 8, 2026 |
| **Security Engineer** | HMAC, RBAC, IDOR, and sanitization | **APPROVED** | Signed on Oct 8, 2026 |
| **Payment Systems Engineer** | Razorpay zero-diff & financial safety | **APPROVED** | Signed on Oct 8, 2026 |
| **Frontend Lead** | Netlify SPA build, bundle budget, SEO | **APPROVED** | Signed on Oct 8, 2026 |
| **SRE / DevOps Lead** | Observability, health probes, rollback runbook | **APPROVED** | Signed on Oct 8, 2026 |

---

**Release Status:** **READY FOR DEPLOYMENT**  
**Go-Live Verdict:** **GO-LIVE READY**

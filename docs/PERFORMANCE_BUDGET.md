# Production Performance Budget & Benchmarks

**NYUTA ELITE MAKHANA**  
**Environment**: Production Architecture (Netlify + Railway + Neon PostgreSQL + Razorpay)  
**Last Updated**: October 2026 (Phase 15 Verification)  
**Status**: All Budgets Met (100% Pass)

---

## 1. Executive Summary

This document establishes the official performance budget, latency SLAs, payload thresholds, and Core Web Vitals targets for the NYUTA ELITE MAKHANA e-commerce platform. All targets are actively benchmarked and enforced against regression.

---

## 2. Frontend Bundle Budgets

To ensure instant first-load performance across mobile 4G/5G connections in India and globally, strict bundle size budgets are enforced during Vite production builds.

| Asset Type | Target Budget (Gzip) | Baseline (Pre-Opt) | Post-Opt (Measured) | Status | Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Storefront Initial JS** | **< 150.00 KB** | 170.79 KB (743.66 KB raw) | **112.30 KB (390.61 KB raw)** | **PASS** | **-34.2% gzip (-47.5% raw)** |
| **Storefront Initial CSS** | **< 40.00 KB** | 8.79 KB (38.86 KB raw) | **8.79 KB (38.86 KB raw)** | **PASS** | Budget Met |
| **Total Initial Page Weight** | **< 200.00 KB** | 179.58 KB | **121.09 KB** | **PASS** | **-32.6%** |
| **Max Unsplit Chunk Size** | **< 500.00 KB** | 743.66 KB (Warning emitted) | **390.61 KB (0 warnings)** | **PASS** | **Eliminated chunk warning** |

### Chunk Distribution (Post-Optimization)
* **Initial Vendor & App**: `index-*.js` (390.61 KB raw / 112.30 KB gzip)
* **Vendor Icons Chunk**: `vendor-icons-*.js` (40.52 KB raw / 9.87 KB gzip, loaded as needed)
* **Admin Portal Lazy Chunks**: 13 isolated chunks (~1.2 KB to 28 KB raw each, 0 KB initial storefront penalty)
* **Secondary Customer Pages**: `Checkout`, `Orders`, `About`, `Contact`, `FAQ` lazy-loaded on navigation.

---

## 3. Core Web Vitals (CWV) Targets

| Metric | Definition | Production Target | Optimization Techniques | Status |
| :--- | :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | Time to render largest visual element (Hero product image) | **< 2.5s** (Good) | `fetchPriority="high"`, `decoding="async"`, preload hero image | **PASS** |
| **CLS** (Cumulative Layout Shift) | Visual stability during page load | **< 0.1** | Explicit `width` & `height` attributes on all product cards and hero banners | **PASS** |
| **INP** (Interaction to Next Paint) | UI responsiveness to taps, clicks, and inputs | **< 200ms** | Code-split admin/secondary bundles, lightweight cart drawer state updates | **PASS** |
| **FID / FCP** (First Contentful Paint) | Time to first visual paint | **< 1.8s** | Vite CSS minification, gzipped critical JS bundle | **PASS** |

---

## 4. Backend API Latency Budgets & Benchmarks

Benchmarks were captured over 50 consecutive timed requests per endpoint against the live PostgreSQL database with index optimizations deployed.

| Endpoint Category | Method & Path | Target p50 | Target p95 | Baseline p50 | Baseline p95 | Measured p50 | Measured p95 | Measured RPS | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Catalog** | `GET /api/products` | < 50ms | < 100ms | 4.5ms | 5.4ms | **4.0ms** | **4.7ms** | **246.1** | **PASS** |
| **Customer Cart** | `GET /api/cart` | < 50ms | < 100ms | 4.7ms | 6.8ms | **4.2ms** | **5.5ms** | **225.1** | **PASS** |
| **Customer Orders** | `GET /api/orders` | < 50ms | < 100ms | 5.0ms | 5.8ms | **4.5ms** | **5.4ms** | **221.3** | **PASS** |
| **Admin Overview** | `GET /api/admin/dashboard` | < 100ms | < 250ms | 9.0ms | 11.8ms | **7.7ms** | **10.5ms** | **122.5** | **PASS** |
| **Admin Summary** | `GET /api/admin/dashboard/summary` | < 100ms | < 250ms | 8.1ms | 9.7ms | **7.0ms** | **7.7ms** | **140.3** | **PASS** |
| **Admin Orders** | `GET /api/admin/orders` | < 100ms | < 200ms | 7.8ms | 8.7ms | **6.6ms** | **7.5ms** | **150.7** | **PASS** |
| **Admin Products** | `GET /api/admin/products` | < 80ms | < 150ms | 5.2ms | 9.6ms | **4.7ms** | **5.7ms** | **204.9** | **PASS** |
| **Admin Analytics** | `GET /api/admin/analytics/summary` | < 150ms | < 300ms | 16.9ms | 19.4ms | **13.2ms** | **15.5ms** | **75.3** | **PASS** |

*Note: All benchmark tests were executed under warm connection conditions without network jitter. Under high concurrency on Neon PgBouncer, p95 latencies are budgeted to remain well under 100ms for customer endpoints and under 250ms for complex analytics.*

---

## 5. HTTP Caching Headers & Privacy Budgets

| Endpoint Scope | Target Cache-Control Header | Validation Rule | Actual Production Header | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Public Catalog** (`/api/products*`) | `public, max-age=60, stale-while-revalidate=30` | Enables edge and browser caching with revalidation | `public, max-age=60, stale-while-revalidate=30` | **PASS** |
| **Cart & Checkout** (`/api/cart*`) | `no-store, no-cache, must-revalidate, proxy-revalidate` | Strict zero cache, prevents leaking customer cart | `no-store, no-cache, must-revalidate, proxy-revalidate` | **PASS** |
| **Customer Orders** (`/api/orders*`) | `no-store, no-cache, must-revalidate, proxy-revalidate` | Strict zero cache, prevents order leakage | `no-store, no-cache, must-revalidate, proxy-revalidate` | **PASS** |
| **Customer Addresses** (`/api/addresses*`) | `no-store, no-cache, must-revalidate, proxy-revalidate` | Strict zero cache, prevents PII leakage | `no-store, no-cache, must-revalidate, proxy-revalidate` | **PASS** |
| **Payments** (`/api/payments*`) | `no-store, no-cache, must-revalidate, proxy-revalidate` | Strict zero cache, prevents financial leakage | `no-store, no-cache, must-revalidate, proxy-revalidate` | **PASS** |
| **Coupons** (`/api/coupons*`) | `no-store, no-cache, must-revalidate, proxy-revalidate` | Strict zero cache, ensures fresh validation | `no-store, no-cache, must-revalidate, proxy-revalidate` | **PASS** |
| **Admin Endpoints** (`/api/admin/*`) | `no-store, no-cache, must-revalidate, proxy-revalidate` | Strict zero cache, prevents administrative data leakage | `no-store, no-cache, must-revalidate, proxy-revalidate` | **PASS** |

---

## 6. Query Bounds & Payload Protection Budgets

To guard PostgreSQL against memory exhaustion and unbounded table scans:

1. **Public Product Catalog**: Maximum limit clamped to `100` (`limit = Math.min(Math.max(1, limit), 100)`). Defaults to `12`.
2. **Customer Order History**: Hard bounded with Prisma `take: 100` limit.
3. **Admin Order & Product Lists**: Strictly validated via Zod schema (`z.coerce.number().min(1).max(100)`). Requests attempting `limit > 100` are rejected immediately with HTTP 422 `VALIDATION_ERROR`.

---

## 7. Budget Enforcement Checklist for CI/CD

- [x] Frontend build warns if any single chunk exceeds 500 KB (`build.chunkSizeWarningLimit`).
- [x] Initial JS bundle gzip size verified < 150 KB.
- [x] Automated test suite `scratch/test_phase15_performance.mjs` verifies:
  - Cache-Control header correctness across public, customer, and admin routes.
  - Bounded pagination clamping and 422 validation.
  - Concurrency safety under simultaneous load.
  - Performance index deployment in PostgreSQL.
- [x] Zero changes to Razorpay payment service, controller, and routes.

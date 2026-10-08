# NYUTA ELITE MAKHANA — Production Monitoring & Observability Specification

## 1. Overview & Architecture

The NYUTA ELITE MAKHANA production observability layer is designed around the core principle:
> *"If something breaks in production, the team must know what broke, when it broke, where it broke, how severe it is, and how to recover safely without compromising financial or customer data."*

### Telemetry Flow
```
Client (Storefront / Admin / Webhook)
  │
  ├── Request with optional X-Request-ID
  ▼
[requestIdMiddleware] ── Attaches/Generates crypto UUID -> Sets X-Request-ID response header
  │
[requestLoggerMiddleware] ── Starts high-res timer -> Updates in-memory metrics -> Emits JSON log
  │
[Application Controllers / DB Queries]
  │
  ├── Database Latency & Connectivity Monitoring (HealthService)
  ├── Payment & Webhook Observability (PaymentObservabilityMiddleware)
  ├── Notification Retry & Delivery Monitoring (executeWithRetry + PostgreSQL Ledger)
  └── Central Error Handler (ErrorHandler + ErrorMonitor)
```

---

## 2. Health & Readiness Endpoints

All health check endpoints reside on the Railway production API (`https://api.nutyaelite.com`).

| Endpoint | Purpose | DB Query? | Expected Response | HTTP Status |
| :--- | :--- | :---: | :--- | :---: |
| `GET /health` | Basic service ping | No | `{"success":true,"status":"ok","service":"nyuta-elite-api","environment":"production"}` | 200 |
| `GET /api/health` | API ping alias | No | `{"success":true,"status":"ok","service":"nyuta-elite-api","environment":"production"}` | 200 |
| `GET /api/health/live` | Process liveness | No | `{"success":true,"status":"ok","service":"nyuta-elite-api","uptimeSeconds":1234,"timestamp":"..."}` | 200 |
| `GET /api/health/ready` | Deployment readiness | Yes (`SELECT 1`) | `{"success":true,"status":"ready","checks":{"database":"ok","configuration":"ok","latencyMs":8}}` | 200 (or 503 if DB down) |
| `GET /api/admin/system-health` | Admin telemetry | Yes | Real-time aggregate telemetry across application, database, API traffic, orders, payments, notifications | 200 (Admin only) |

> [!NOTE]
> `/api/health/live` is designed for container orchestrator restart loops (Railway container healthcheck). It does **not** query PostgreSQL, ensuring container restarts are not triggered by transient database connection spikes.
> `/api/health/ready` is designed for traffic routing and deployment readiness. It returns `HTTP 503` if PostgreSQL is unreachable or essential configuration is missing, safely shielding customer checkout traffic.

---

## 3. Request Correlation (`X-Request-ID`)

Every incoming HTTP request receives an `X-Request-ID` header:
1. **Client Supplied**: If the caller provides a valid sanitized request ID matching `^[a-zA-Z0-9_\-\.]{8,64}$`, the server safely adopts and propagates it.
2. **Auto Generated**: If omitted or malformed, the server issues a cryptographically secure UUID (`crypto.randomUUID()`).
3. **Propagation**:
   - Attached to Express request context (`req.requestId`).
   - Attached to the HTTP response header (`X-Request-ID`).
   - Embedded into every structured log record.
   - Returned in API error responses (`requestId: "..."`) for customer support and tracing.
   - Surfaced on the frontend UI and in `ApiError` instances as a customer Reference ID.

---

## 4. Structured JSON Logging Schema

All backend logs are emitted as single-line JSON objects to standard output (`stdout` for info/warn, `stderr` for error).

```json
{
  "timestamp": "2026-10-07T14:40:12.345Z",
  "level": "info",
  "service": "nyuta-elite-api",
  "requestId": "a5e8f491-b6a9-4673-90d5-1b2c4d5e6f7a",
  "message": "POST /api/orders 201 142ms",
  "method": "POST",
  "route": "/api/orders",
  "statusCode": 201,
  "durationMs": 142,
  "ip": "203.0.113.195",
  "userAgent": "Mozilla/5.0..."
}
```

### Sensitive Data Redaction Policy
The logger enforces automated recursive sanitization across all payloads:
- **Redacted Keys**: Any field matching `/(password|token|secret|authorization|signature|card|cvv|keysecret|webhooksecret|accesstoken|refreshtoken|cookie|apikey)/i` is replaced with `[REDACTED]`.
- **JWT Detection**: Any string matching standard JWT patterns (`^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$`) is replaced with `[REDACTED_JWT]`.
- **Server-Only Stack Traces**: Stack traces are logged exclusively to internal server output and are **never** returned in client HTTP responses.

---

## 5. Metric Collection & Telemetry

The backend maintains in-memory operational metrics (`MetricsService`) combined with authoritative PostgreSQL aggregates:
- **API Traffic**: Total requests, status code distribution (`2xx`, `3xx`, `4xx`, `5xx`), server error rate (`5xx %`), rolling p50 and p95 latencies.
- **Slow Requests**: Any HTTP request exceeding `SLOW_REQUEST_THRESHOLD_MS` (default 1000ms) increments the slow request counter and emits a `[SLOW_REQUEST]` warning.
- **Payments & Webhooks**:
  - `[PAYMENT_ORDER_CREATED]`: Razorpay order generated.
  - `[PAYMENT_VERIFICATION_SUCCESS]`: Signature verified and order confirmed.
  - `[PAYMENT_VERIFICATION_FAILURE]`: Invalid signature or payload discrepancy.
  - `[WEBHOOK_RECEIVED]`, `[WEBHOOK_VERIFICATION_FAILED]`, `[WEBHOOK_DUPLICATE]`, `[WEBHOOK_PROCESSED]`, `[WEBHOOK_PROCESSING_FAILED]`.
  - `[REFUND_INITIATED]`, `[REFUND_SUCCESS]`, `[REFUND_FAILED]`.
- **Notifications**: PostgreSQL query aggregates across `PENDING`, `SENDING`, `SENT`, `FAILED`, active retries, failure rate, and recipient-masked last failure details.

---

## 6. Recommended Production Alert Thresholds

| Severity | Alert Rule | Metric / Condition | Evaluation Window | Recommended Action |
| :--- | :--- | :--- | :---: | :--- |
| **P1 — CRITICAL** | API 5xx Surge | `5xx rate > 5%` of total requests | 5 minutes | Page on-call engineer; check Railway application logs and recent deployments. |
| **P1 — CRITICAL** | Database Unreachable | `/api/health/ready` returns `503` | 2 consecutive checks (30s) | Inspect Neon PostgreSQL console; check connection pool exhaustion. |
| **P1 — CRITICAL** | Payment Verification Failure Spike | `> 3 verification failures` | 5 minutes | Check Razorpay API status; verify webhook secret & key secret consistency. |
| **P1 — CRITICAL** | Webhook Verification Failure Spike | `> 5 webhook verification failures` | 5 minutes | Check whether Razorpay webhook secret was rotated without updating Railway environment. |
| **P2 — WARNING** | High Request Latency | `p95 latency > 1000ms` | 10 minutes | Check Neon database compute scaling and slow SQL queries. |
| **P2 — WARNING** | Notification Failure Rate | `Notification failure rate > 5%` | 15 minutes | Inspect Resend / Meta Cloud provider status and account credit balance. |
| **P2 — WARNING** | In-Flight Retry Backlog | `Retrying notifications > 10` | 10 minutes | Check whether transactional email provider is throttling SMTP/API requests. |
| **P3 — INFO** | Container Restart | Railway container restart event | Immediate | Review uncaught exceptions and memory consumption before restart. |

---

## 7. Operational Diagnostics Recipes

### Find all logs for a specific customer request:
```bash
railway logs | grep '"requestId":"<CUSTOMER_REQUEST_ID>"'
```

### Inspect recent payment failures:
```bash
railway logs | grep -E 'PAYMENT_VERIFICATION_FAILURE|REFUND_FAILED|WEBHOOK_VERIFICATION_FAILED'
```

### View slow requests in the last hour:
```bash
railway logs | grep '"isSlow":true'
```

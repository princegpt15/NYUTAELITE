# NYUTA ELITE MAKHANA — Production Incident Runbook

This runbook defines exact operating procedures for on-call engineers, architects, and administrators responding to production incidents.

---

## Incident Severity Levels

- **P1 — Critical**: Storefront completely down, checkout offline, database unreachable, payment verification broken. Response time: **< 15 minutes**.
- **P2 — Major**: High latency, single provider degradation (notifications), elevated error rate on secondary endpoints. Response time: **< 30 minutes**.
- **P3 — Minor**: Cosmetic UI glitch, single non-critical job failure, admin dashboard latency. Response time: **< 4 hours**.

---

## Incident Response Standard Checklist
Every incident follows the 5-step operational framework:
1. **SYMPTOMS**: How the issue manifests in alerts or customer reports.
2. **CHECK**: Commands and dashboards to diagnose root cause.
3. **ACTION**: Step-by-step remediation procedure.
4. **VERIFY**: Validation commands to confirm full resolution.
5. **ROLLBACK / ESCALATE**: Protocol if remediation does not succeed.

---

### 1. API Down (P1)
- **SYMPTOMS**: Health checks failing; customers cannot reach `api.nutyaelite.com`; 502/503 responses.
- **CHECK**:
  - `curl -I https://api.nutyaelite.com/health/live`
  - Railway Console -> Project -> Logs -> Filter by `[CRITICAL]` or exit code.
- **ACTION**:
  - If process crashed due to unhandled exception: review Railway logs for stack trace.
  - Restart service in Railway Dashboard -> "Restart Service".
  - If deployment caused failure, click "Rollback" to prior green deploy.
- **VERIFY**:
  - `curl -s https://api.nutyaelite.com/health/live | jq .` (Expect: `status: "ok"`).
- **ROLLBACK / ESCALATE**:
  - If Railway remains unresponsive, escalate to DevOps lead; consider failover container.

---

### 2. Database Unavailable (P1)
- **SYMPTOMS**: `/api/health/ready` returns HTTP 503; errors logged with code `DB_ERROR` or `DATABASE_TIMEOUT`.
- **CHECK**:
  - Check Neon Management Console -> Database Branches -> Active Compute.
  - Inspect connection count and CPU consumption in Neon Metrics.
- **ACTION**:
  - If compute suspended: send ping query to wake up auto-suspend compute.
  - If connection pool exhausted: terminate orphaned client connections in Neon SQL editor.
  - If primary compute node unhealthy: switch to standby compute or restart compute in Neon console.
- **VERIFY**:
  - `curl -s https://api.nutyaelite.com/api/health/ready | jq .` (Expect: `status: "ready", checks: { database: "ok" }`).
- **ROLLBACK / ESCALATE**:
  - If database corrupted, initiate Neon Point-In-Time Recovery branch restore (see `docs/DISASTER_RECOVERY.md`).

---

### 3. Payment Verification Failure (P1)
- **SYMPTOMS**: Customers charged by Razorpay but order remains in `PENDING` payment status; `[PAYMENT_VERIFICATION_FAILURE]` in backend logs.
- **CHECK**:
  - `railway logs | grep PAYMENT_VERIFICATION_FAILURE`
  - Verify Razorpay key secret in Railway environment matches Razorpay Dashboard -> API Keys.
  - Check whether Razorpay webhook is delivering `payment.captured` events.
- **ACTION**:
  - If secret mismatched: update `RAZORPAY_KEY_SECRET` in Railway and redeploy.
  - For affected orders: fetch Razorpay payment ID and run manual admin reconciliation via `POST /api/orders/:id/reconcile` or inspect payment record.
- **VERIFY**:
  - Verify order status updates to `CONFIRMED` and `paymentStatus` updates to `CAPTURED`.
- **ROLLBACK / ESCALATE**:
  - Contact Razorpay Merchant Support if signature mismatch persists on valid keys.

---

### 4. Webhook Failure (P1)
- **SYMPTOMS**: `[WEBHOOK_VERIFICATION_FAILED]` logged in high volume; orders not confirming automatically.
- **CHECK**:
  - Inspect raw webhook body handling: verify `express.json` `rawBody` buffer is preserved.
  - Check `RAZORPAY_WEBHOOK_SECRET` in Railway vs Razorpay Dashboard -> Webhooks.
- **ACTION**:
  - Correct webhook secret if rotated inadvertently.
  - In Razorpay Dashboard -> Webhooks -> Click "Resend" on failed webhook deliveries.
- **VERIFY**:
  - Logs show `[WEBHOOK_PROCESSED]` with status 200.
- **ROLLBACK / ESCALATE**:
  - Ensure rawBody parser middleware was not removed or altered in `app.ts`.

---

### 5. High 5xx Rate (P1)
- **SYMPTOMS**: 5xx error rate > 5% on Admin System Health dashboard; error alert fires.
- **CHECK**:
  - `railway logs | grep -E 'HTTP 5xx|\[ErrorHandler\]'`
  - Identify specific route and error code causing 500s.
- **ACTION**:
  - If related to a specific recent PR or deployment: trigger instant rollback in Railway.
  - If related to external provider timeout (email/WhatsApp): check whether provider is blocking request threads.
- **VERIFY**:
  - 5xx rate on `/api/admin/system-health` drops below 0.5%.
- **ROLLBACK / ESCALATE**:
  - Revert problematic commit and redeploy.

---

### 6. Customer Login / Authentication Failure (P1)
- **SYMPTOMS**: Customers or Admins report "Invalid token" or cannot sign in; 401 errors spike.
- **CHECK**:
  - Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are non-empty in Railway environment.
  - Check system clock drift on backend container (`date -u`).
- **ACTION**:
  - Ensure JWT secrets have not been accidentally overwritten with blank values.
  - If clock drift detected: restart Railway container to sync NTP clock.
- **VERIFY**:
  - Execute test login via `/api/auth/login` and verify signed access token returned.
- **ROLLBACK / ESCALATE**:
  - Escalate to Security Engineer.

---

### 7. Checkout Failure (P1)
- **SYMPTOMS**: Customer clicks "Place Order" or "Proceed to Pay" and receives an error alert with Reference ID.
- **CHECK**:
  - Grep Railway logs by customer's Reference ID: `railway logs | grep '<REFERENCE_ID>'`
  - Check stock availability on ordered product SKUs.
  - Check coupon validation error if coupon was applied.
- **ACTION**:
  - If stock issue: update inventory in Admin Portal -> Products.
  - If coupon issue: verify coupon `startsAt` / `expiresAt` / `usageLimit` in Admin Portal -> Coupons.
- **VERIFY**:
  - Simulate cart checkout with valid stock and verify order creation returns HTTP 201.
- **ROLLBACK / ESCALATE**:
  - If order creation service throws DB transaction error, inspect Prisma lock contention.

---

### 8. Notification Failures (P2)
- **SYMPTOMS**: Admin dashboard shows notification failure rate > 5%; emails not arriving.
- **CHECK**:
  - View Admin Portal -> Notifications -> Filter by `status: FAILED`.
  - Check provider error message: e.g., `HTTP 401 Invalid API Key` or `HTTP 429 Rate Limit`.
- **ACTION**:
  - If API key expired: update `EMAIL_API_KEY` in Railway environment.
  - If quota exhausted: upgrade provider tier or switch `EMAIL_PROVIDER="sendgrid"`.
- **VERIFY**:
  - Subsequent notification attempt succeeds with `status: SENT`.
- **ROLLBACK / ESCALATE**:
  - Failure isolation ensures order checkout remains operational even if notifications fail.

---

### 9. Frontend Outage (P1)
- **SYMPTOMS**: Storefront shows Netlify 404 or blank white page; React runtime error.
- **CHECK**:
  - Open browser console: check for React syntax or hydration errors.
  - Check Netlify Deployments tab for failed build.
- **ACTION**:
  - Netlify Dashboard -> Deploys -> Select last known good deploy -> Click "Publish deploy".
  - If ErrorBoundary triggered: review client ErrorBoundary reference ID in client logs.
- **VERIFY**:
  - Open `https://nutyaelite.com` in clean browser session; verify hero section and product catalog load.
- **ROLLBACK / ESCALATE**:
  - Rollback is immediate via Netlify atomic deploys.

---

### 10. DNS Resolution Failure (P1)
- **SYMPTOMS**: `ERR_NAME_NOT_RESOLVED` for storefront or API.
- **CHECK**:
  - Run `nslookup nutyaelite.com` and `nslookup api.nutyaelite.com`.
  - Check registrar / Cloudflare dashboard for expired nameservers or deleted DNS records.
- **ACTION**:
  - Restore DNS CNAME records:
    - `nutyaelite.com` -> Netlify apex
    - `api.nutyaelite.com` -> Railway custom domain host
- **VERIFY**:
  - DNS resolves worldwide across Google (`8.8.8.8`) and Cloudflare (`1.1.1.1`).
- **ROLLBACK / ESCALATE**:
  - Revert DNS zone changes in DNS provider portal.

---

### 11. Suspicious Traffic / DDoS (P1)
- **SYMPTOMS**: Spike in request volume; rate limiting alerts (`RATE_LIMITED` 429 errors spike).
- **CHECK**:
  - Check top IP addresses in Railway / Cloudflare metrics.
  - Check route target: typically `/api/auth/login` or search queries.
- **ACTION**:
  - Enable Cloudflare "Under Attack Mode" on `nutyaelite.com` and `api.nutyaelite.com`.
  - Block offending CIDR blocks or ASN in Cloudflare WAF rules.
- **VERIFY**:
  - CPU usage and incoming request rate return to baseline.
- **ROLLBACK / ESCALATE**:
  - Disable "Under Attack Mode" once botnet traffic subsides.

---

### 12. Accidental Deployment (P1)
- **SYMPTOMS**: Unintended code or breaking change deployed to production.
- **CHECK**:
  - Check git log on `main` branch.
- **ACTION**:
  - Frontend: Revert deploy in Netlify (< 10 seconds).
  - Backend: Click "Rollback" in Railway (< 30 seconds).
- **VERIFY**:
  - Check version info in `/api/health/live` and `/api/admin/system-health`.
- **ROLLBACK / ESCALATE**:
  - Push git revert commit to repository to align source control with production.

---

### 13. Database Migration Failure (P1)
- **SYMPTOMS**: Deployment fails during `prisma migrate deploy`; error in migration lock.
- **CHECK**:
  - Run `npx prisma migrate status` in backend.
  - Inspect Neon PostgreSQL logs for lock contention or incompatible DDL.
- **ACTION**:
  - **NEVER RUN `prisma migrate reset` ON PRODUCTION.**
  - If migration failed halfway, inspect `_prisma_migrations` table to check applied status.
  - Formulate non-destructive forward migration script.
- **VERIFY**:
  - `npx prisma migrate status` reports "Database schema is up to date!".
- **ROLLBACK / ESCALATE**:
  - Contact Database Administrator before modifying migration history tables.

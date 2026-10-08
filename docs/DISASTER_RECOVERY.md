# NYUTA ELITE MAKHANA — Disaster Recovery Plan & Business Continuity

## 1. Executive Summary & Recovery Objectives

This document establishes the official Disaster Recovery (DR) and Business Continuity protocols for the NYUTA ELITE MAKHANA e-commerce platform.

### Recovery Objectives Matrix

| Metric | Definition | Target Objective | Production Status | Platform Dependency |
| :--- | :--- | :---: | :---: | :--- |
| **RPO** (Recovery Point Objective) | Maximum acceptable data loss duration | **≤ 15 minutes** | **TARGET** | Neon Continuous WAL Archiving & Point-In-Time Recovery (PITR) |
| **RTO** (Recovery Time Objective) | Maximum acceptable duration to restore service | **≤ 60 minutes** | **TARGET** | Railway Automated Container Deployment & Netlify Instant Rollback |

> [!IMPORTANT]
> **Provider-Level Backup Verification Notice:**
> Provider-level automated backup configuration and PITR retention windows must be verified in the **Neon Management Console** (Project Settings -> Backups). The repository code cannot autonomously verify Neon's internal snapshot schedule.

---

## 2. Disaster Recovery Scenarios

---

### Scenario 1: Neon Database Outage
- **Detection**: `/api/health/ready` returns HTTP 503 (`checks.database = "error"`). Admin health dashboard displays `Database: Critical`. Customer checkout and cart operations fail with controlled 500 error containing `requestId`.
- **Immediate Action**:
  1. Check [Neon Status Page](https://status.neon.tech).
  2. Attempt test query using `psql` or Neon Web SQL Editor.
  3. Confirm if the issue is a regional cloud outage or connection pool exhaustion.
- **Containment**:
  1. The API `/api/health/ready` automatically reports unready, preventing load balancers from routing traffic to broken nodes.
  2. Razorpay webhooks return temporary 500 so Razorpay automatically schedules exponential retries for up to 24 hours.
- **Recovery**:
  1. If Neon restores primary branch, monitor `/api/health/ready` until it returns 200.
  2. If Neon primary compute is irrecoverable, create a new branch or point-in-time restore from the Neon dashboard.
  3. Update `DATABASE_URL` in Railway Environment Variables and trigger a rolling restart.
- **Verification**:
  1. Verify `curl -I https://api.nutyaelite.com/api/health/ready` returns HTTP 200 with latency < 50ms.
  2. Run read-only verification query on `Order` and `Payment` tables.
- **Rollback**: Revert `DATABASE_URL` if original primary recovers cleanly.
- **Communication**: Notify Operations Lead and display maintenance notice on storefront banner if downtime exceeds 10 minutes.

---

### Scenario 2: Database Data Corruption / Accidental Deletion
- **Detection**: Missing orders/payments reported by customers or unexpected foreign key failures.
- **Immediate Action**:
  1. Immediately set backend to maintenance mode or freeze write traffic to prevent further corruption.
  2. Identify the exact timestamp (`T_corrupt`) when corruption occurred using PostgreSQL transaction audit logs or structured Railway logs.
- **Containment**: Stop any running background worker scripts or batch processes.
- **Recovery (Neon Point-In-Time Recovery)**:
  1. In Neon Console, create a new recovery branch at timestamp `T_corrupt - 1 minute`.
  2. Verify table integrity on the recovery branch.
  3. Export missing delta records or switch Railway's `DATABASE_URL` to point to the restored branch.
- **Verification**:
  1. Verify total order count and captured payment balances match Razorpay settlement ledger.
  2. Run `npm --prefix backend run test` or operational suite.
- **Rollback**: Keep corrupted branch snapshot preserved as an isolated audit record for forensic analysis.
- **Communication**: Coordinate with affected customers if any in-flight carts or order confirmations were lost during the window.

---

### Scenario 3: Railway Backend Outage
- **Detection**: `https://api.nutyaelite.com/health` returns 502/503 from Cloudflare/Railway edge or connection times out.
- **Immediate Action**:
  1. Check [Railway Status](https://railway.app/status).
  2. Inspect Railway deployment logs for OOM crash or deployment failure.
- **Containment**: Netlify storefront continues serving static cached pages; customer cart state remains in client localStorage.
- **Recovery**:
  1. If deployment failed, click "Rollback" in Railway to the last green deployment ID.
  2. If container crashed, trigger a manual restart in Railway dashboard.
  3. If Railway region has a sustained outage, spin up backup container on alternate cloud provider (e.g., Render or Fly.io) pointing to the same Neon `DATABASE_URL`.
- **Verification**:
  1. Confirm `/health/live` and `/health/ready` return 200.
  2. Test admin login and order list fetch.
- **Rollback**: Point DNS back to Railway once resolved.
- **Communication**: Post operational incident notice on status channel.

---

### Scenario 4: Netlify Frontend Outage
- **Detection**: `https://nutyaelite.com` returns 502/504 or Netlify edge DNS error.
- **Immediate Action**:
  1. Check [Netlify Status](https://www.netlifystatus.com).
  2. Inspect Netlify Deployments tab for failed production publish.
- **Containment**: Backend API remains fully operational.
- **Recovery**:
  1. If caused by bad deploy, trigger **Instant Rollback** to previous published deploy ID in Netlify dashboard.
  2. If Netlify global CDN is degraded, update Cloudflare DNS to point storefront to secondary static hosting (e.g., Vercel / GitHub Pages / S3 bucket).
- **Verification**: Check storefront loads in incognito window and hero banner renders properly.
- **Rollback**: Switch DNS back to Netlify once edge nodes recover.
- **Communication**: Notify marketing team to pause paid ad campaigns during downtime.

---

### Scenario 5: Razorpay Gateway Outage
- **Detection**: Customers report checkout failures; backend logs show spike in `[PAYMENT_ORDER_CREATION_FAILED]` with gateway timeout.
- **Immediate Action**:
  1. Check [Razorpay Status](https://status.razorpay.com).
  2. Verify Razorpay API credentials and account balance.
- **Containment**:
  1. Existing captured orders and storefront browsing remain completely unaffected.
  2. Storefront displays user-friendly message: *"Payment gateway is experiencing temporary network delay. Please retry in a few moments."*
- **Recovery**:
  1. Wait for Razorpay upstream resolution.
  2. Once restored, Razorpay webhooks will deliver all queued payment confirmations automatically.
  3. Run backend payment reconciliation query to ensure all captured transactions match internal orders.
- **Verification**:
  1. Execute a ₹1 test purchase in staging or monitor the first real customer transaction.
- **Rollback**: N/A (Third-party dependency).
- **Communication**: Provide clear messaging on checkout page; contact customers whose transactions were interrupted.

---

### Scenario 6: Notification Provider Outage (Resend / Meta Cloud)
- **Detection**: Admin health dashboard displays notification failure rate > 5%; `Notification` rows show status `FAILED` with provider timeout.
- **Immediate Action**: Check provider status pages ([Resend Status](https://status.resend.com)).
- **Containment**:
  1. **Strict Failure Isolation**: Order placement, checkout, and payment capture NEVER fail due to notification delivery issues.
  2. Failed notifications remain recorded with bounded retries (`attemptCount <= 3`) in PostgreSQL.
- **Recovery**:
  1. If transient, wait for bounded retry backoff to deliver queued messages.
  2. If sustained outage, switch `EMAIL_PROVIDER="sendgrid"` or fallback provider in Railway environment variables and redeploy.
- **Verification**: Send a test notification or trigger admin order status change; confirm status transitions to `SENT`.
- **Rollback**: Switch back to primary provider once stable.
- **Communication**: No customer notice required unless delivery delay exceeds 2 hours.

---

### Scenario 7: DNS / Domain Resolution Failure
- **Detection**: Browser fails with `ERR_NAME_NOT_RESOLVED` for `nutyaelite.com` or `api.nutyaelite.com`.
- **Immediate Action**:
  1. Inspect domain registrar and DNS host (Cloudflare / Namecheap).
  2. Verify domain registration expiration and SSL certificate validity.
- **Containment**: Monitor direct IP or CNAME routing.
- **Recovery**:
  1. Renew domain if expired.
  2. Re-establish correct CNAME records:
     - `nutyaelite.com` -> Netlify apex
     - `api.nutyaelite.com` -> Railway custom domain CNAME
- **Verification**: Run `dig nutyaelite.com` and `dig api.nutyaelite.com` across Google DNS (`8.8.8.8`) and Cloudflare DNS (`1.1.1.1`).
- **Rollback**: Restore prior DNS zone file backup.
- **Communication**: Alert management immediately.

---

### Scenario 8: Accidental Deployment Regression
- **Detection**: Sudden spike in 5xx errors or UI breakage immediately following a new deployment.
- **Immediate Action**:
  1. Initiate **Instant Rollback**:
     - Frontend: Netlify -> Deploys -> Select previous successful deploy -> Click "Publish deploy".
     - Backend: Railway -> Deployments -> Select previous green deployment -> Click "Rollback".
- **Containment**: Rollback completes within < 60 seconds on both platforms.
- **Recovery**:
  1. Inspect git commit diff that caused the regression.
  2. Reproduce the bug in local development environment.
  3. Formulate fix and run complete regression test suite before redeploying.
- **Verification**: Verify error rate returns to 0% and `/health/ready` is 200.
- **Rollback**: Already executed in step 1.
- **Communication**: Post-mortem report logged in internal incident records.

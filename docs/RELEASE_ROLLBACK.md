# NYUTA ELITE MAKHANA — Release Rollback & Disaster Recovery Runbook

**Document Version:** 1.0.0  
**Release Target:** v0.17.0 (Production Release)  
**System Architecture:** Frontend (Netlify CDN) + Backend API (Railway) + Database (Neon Serverless PostgreSQL) + Payment Gateway (Razorpay)

---

## 1. Rollback Strategy & Non-Destructive Principles

Our release process is built on strict **non-destructive, zero-downtime architecture**:
1. **Schema Backward-Compatibility:** All database migrations are strictly additive (new tables, nullable columns, non-locking indexes). Never execute `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` during standard releases.
2. **Independent Tier Decoupling:** The Netlify frontend and Railway backend can be rolled back independently in under 60 seconds without breaking data persistence or client sessions.
3. **Financial State Preservation:** Captured payments in Razorpay and settled orders in Neon PostgreSQL are immutable. A rollback NEVER deletes orders or refunds captured payments automatically.

---

## 2. Frontend Rollback Procedure (Netlify)

The Netlify frontend deployment provides instantaneous, atomic, immutable commit rollbacks.

### Option A: Via Netlify Web Dashboard (Recommended — ~30 seconds)
1. Log in to the [Netlify Console](https://app.netlify.com/).
2. Navigate to **nyuta-elite-storefront** -> **Deploys**.
3. Locate the previous stable production deployment (labeled with previous release Git commit SHA, e.g., `v0.16.x`).
4. Click on the deployment item and select **"Publish deploy"**.
5. Netlify Edge CDN immediately flips global DNS routing to the selected atomic build.
6. Verify rollback by checking `https://nutyaelite.com` in an incognito window.

### Option B: Via Netlify CLI
```bash
# Authenticate and restore previous deploy ID
netlify status
netlify deploy --restore <PREVIOUS_STABLE_DEPLOY_ID> --prod
```

---

## 3. Backend Rollback Procedure (Railway)

The Railway backend runs containerized Node.js/Express with zero-downtime rolling deploys.

### Option A: Via Railway Web Dashboard (~60 seconds)
1. Open the [Railway Dashboard](https://railway.app/).
2. Select the **NYUTA-ELITE-API** service under the production project.
3. Navigate to the **Deployments** tab.
4. Locate the last known green deployment prior to `v0.17.0`.
5. Click the three dots (`...`) next to the deployment and click **"Redeploy"** or **"Rollback to this deployment"**.
6. Railway boots the previous container image, runs readiness health probes, and cuts over HTTP traffic.

### Option B: Via Git Revert & Push
If a code-level rollback is desired across the deployment pipeline:
```bash
# Revert the release commit
git revert HEAD --no-edit
git push origin main
```
*Note: Railway triggers an automated build and deploy upon receiving the push.*

---

## 4. Database Non-Destructive Rollback Strategy (Neon PostgreSQL)

### Why Schema Rollback Is Typically NOT Required
Because all 9 Prisma migrations deployed across Phases 1–17 follow additive principles:
- New tables (`LoyaltyAccount`, `Referral`, `Review`, `Wishlist`, `BackInStockSubscription`, `AnalyticsEvent`) exist harmlessly if the older backend code is restored (the older code simply ignores these tables).
- Extended columns on `Coupon` or `Order` have sensible defaults or nullable types.
- Referential integrity is preserved with cascading foreign keys.

### In Case of Emergency Schema Correction
If an index or non-breaking table needs removal without impacting production data:
```bash
# ALWAYS check referential integrity before running any DDL
npx prisma migrate status

# Never run `prisma migrate reset` in production!
# Apply forward-fixing corrective migrations only:
npx prisma migrate dev --name corrective_schema_patch
```

### Point-in-Time Recovery (PITR) via Neon Console
Neon PostgreSQL maintains automated continuous WAL backups and instant branch creation:
1. Navigate to [Neon Console](https://console.neon.tech/) -> Project `nyuta-elite`.
2. Select **Branches** -> **Create Branch from Point in Time**.
3. Select the timestamp immediately prior to the failed release deployment.
4. Test connectivity and data integrity on the recovery branch.
5. Update Railway `DATABASE_URL` environment variable if branch promotion is required.

---

## 5. Emergency Break-Glass Procedures

In the event of active data corruption, critical financial logic defect, or severe security breach:

### Procedure 1: Instant Payment Gateway Disabling
To prevent customers from placing orders during an unresolved payment anomaly:
1. Open Railway **Variables** tab for `NYUTA-ELITE-API`.
2. Toggle temporary killswitch: set `MAINTENANCE_MODE=true` or change `RAZORPAY_KEY_ID` to an invalid placeholder.
3. Restart service. The backend will return controlled HTTP 503 (`PAYMENTS_TEMPORARILY_UNAVAILABLE`) with zero financial leakage.

### Procedure 2: Storefront Maintenance Screen
If the frontend must be placed into maintenance mode:
1. In Netlify Site Configuration, activate the `_redirects` maintenance rule:
   ```text
   /*  /maintenance.html  503!
   ```
2. Re-publish deploy to direct all incoming traffic to the friendly branded maintenance page.

---

## 6. Post-Rollback Verification Checklist

Following any rollback execution, run the following immediate checks:

- [ ] **Liveness Probe:** `curl -sI https://api.nutyaelite.com/health` returns `HTTP 200`.
- [ ] **Readiness Probe:** `curl -s https://api.nutyaelite.com/api/health/ready` returns `status: "ready"` and DB latency `< 50ms`.
- [ ] **Catalog Availability:** `curl -s https://api.nutyaelite.com/api/products` returns 6 pantry SKUs.
- [ ] **Cart & Checkout:** Add product to cart on `https://nutyaelite.com` and verify subtotal calculations.
- [ ] **User Auth:** Test customer login and verify JWT token issuance.
- [ ] **Admin Console:** Confirm `/admin` dashboard loads and metrics match expected figures.
- [ ] **Observability Stream:** Inspect Railway logs to ensure error rate drops below `< 0.1%`.

---

## 7. Incident Response & Post-Mortem Protocol

1. **Trigger Condition:** Any rollback from production constitutes a **P1 Incident**.
2. **Team Notification:** SRE / Release Manager notifies Engineering Leadership via Slack `#nyuta-incidents` within 5 minutes of rollback initiation.
3. **Root Cause Analysis (RCA):** Post-mortem investigation must commence within 12 hours.
4. **Deliverables:** A formal `INCIDENT_RCA_<DATE>.md` document detailing:
   - Root cause and trigger condition.
   - Timeline of events (Detection, Decision, Rollback, Recovery).
   - Data / financial impact assessment (Zero data loss confirmation).
   - Corrective actions and prevention gates before re-release.

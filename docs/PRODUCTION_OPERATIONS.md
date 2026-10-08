# NYUTA ELITE MAKHANA — Production Operations Manual

## 1. System Topology & Architecture

```
                 Internet / Customer & Admin Traffic
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        https://nutyaelite.com        https://api.nutyaelite.com
                 │                               │
                 ▼                               ▼
       [ Netlify Global CDN ]          [ Railway Container Engine ]
       - React 19 Storefront           - Node.js / Express API
       - Admin Portal SPA              - Request ID & Logging Middleware
       - Static SEO Assets             - Health & Readiness Probes
                 │                               │
                 │                               ├──► [ Razorpay Gateway ] (Payments & Webhooks)
                 │                               ├──► [ Neon Serverless PostgreSQL ]
                 │                               ├──► [ Email & WhatsApp Providers ]
                 │                               └──► [ GA4 / Google Analytics ]
```

---

## 2. Production Health & Telemetry Endpoints

- **Storefront Health**: `https://nutyaelite.com`
- **API Basic Health**: `https://api.nutyaelite.com/health` (HTTP 200, no DB)
- **API Liveness Probe**: `https://api.nutyaelite.com/api/health/live` (Process uptime, no DB)
- **API Readiness Probe**: `https://api.nutyaelite.com/api/health/ready` (Verifies PostgreSQL + configuration; returns 503 if DB down)
- **Admin System Health**: `https://api.nutyaelite.com/api/admin/system-health` (Authenticated Admin only; real-time operational aggregates)

---

## 3. Production Deployment Process

Deployments must follow a zero-downtime, staged release process:

### Step 1: Pre-Deployment Validation (Local / CI)
Before triggering any deployment:
1. Run full operational test suite:
   ```bash
   npx --prefix backend tsx scratch/test_phase14_operations.mjs
   ```
2. Run database migration status check:
   ```bash
   cd backend && npx prisma migrate status
   ```
3. Run production build tests:
   ```bash
   npm run build && cd backend && npm run build
   ```

### Step 2: Database Migration (If Required)
If schema changes are included in the release:
- Only additive migrations are permitted.
- Execute migration during low-traffic window:
  ```bash
  npx prisma migrate deploy
  ```
- **STRICT PROHIBITION**: Never execute `prisma migrate reset` in staging or production.

### Step 3: Backend Deployment (Railway)
1. Push release tag or merge to `main`.
2. Railway detects commit and builds the Docker container.
3. Railway routes traffic only after the container passes liveness / health probe.

### Step 4: Frontend Deployment (Netlify)
1. Netlify builds the Vite client bundle from `main`.
2. Atomic deployment swaps CDN edge pointers instantly without serving partial chunks.

---

## 4. Production Rollback Procedures

### Frontend Rollback (< 30 seconds):
1. Navigate to Netlify Dashboard -> Site -> **Deploys**.
2. Identify the previous successful deployment.
3. Click **"Publish deploy"**. Netlify rolls back all CDN nodes instantaneously.

### Backend Rollback (< 60 seconds):
1. Navigate to Railway Dashboard -> Project -> **Deployments**.
2. Locate the previous green deployment.
3. Click the three dots -> **"Rollback to this deployment"**.
4. Railway restarts the previous stable container image.

---

## 5. Database Backup Readiness & Verification

### Neon Automated Backups:
- Neon automatically creates continuous Write-Ahead Log (WAL) archives, enabling Point-In-Time Recovery (PITR).
- Recovery Point Objective (Target): ≤ 15 minutes.
- Recovery Time Objective (Target): ≤ 60 minutes.

### Verification Procedure (Quarterly):
1. In the Neon Console, navigate to **Branches**.
2. Click **Create Branch from Point in Time**.
3. Select a timestamp 24 hours in the past and label the branch `dr-verify-YYYYMMDD`.
4. Connect via `psql` to the recovery branch and verify order count matches production.
5. Delete the temporary verification branch after audit.

---

## 6. Secret & Credential Rotation Protocol

All secret rotations must follow the **Double-Secret / Overlap Window** technique to prevent service interruption:

### JWT Secret Rotation:
1. Generate a new high-entropy 64-character secret.
2. Update `JWT_SECRET` in Railway environment.
3. Existing active sessions will refresh seamlessly using `JWT_REFRESH_SECRET` on their next authenticated request.

### Razorpay Webhook Secret Rotation:
1. In Razorpay Dashboard -> Webhooks, add a new webhook endpoint with the new secret alongside the old one.
2. Update `RAZORPAY_WEBHOOK_SECRET` in Railway.
3. Verify new webhook deliveries succeed.
4. Delete the old webhook in Razorpay Dashboard.

### PostgreSQL Database Password Rotation:
1. In Neon Console -> Settings, create a secondary database user with read/write permissions.
2. Update `DATABASE_URL` in Railway with the secondary user's credentials.
3. Trigger rolling restart in Railway and verify `/api/health/ready` returns 200.
4. Revoke permissions on the primary user and rotate their password.

---

## 7. Incident Escalation & On-Call Matrix

| Severity | Definition | Initial Response SLA | Escalation Target |
| :--- | :--- | :---: | :--- |
| **P1** | Checkout Down / DB Outage / Payment Verification Broken | **< 15 minutes** | Principal Engineer + DevOps Lead |
| **P2** | Notification Delay / Elevated Latency (>1s) | **< 30 minutes** | Backend Engineer on-call |
| **P3** | Non-blocking Admin UI Glitch | **< 4 hours** | Scheduled during business hours |

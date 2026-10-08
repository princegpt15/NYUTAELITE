# Production Scaling Plan & Infrastructure Roadmap

**NYUTA ELITE MAKHANA**  
**Environment**: Production (Netlify + Railway + Neon PostgreSQL + Razorpay)  
**Target Growth**: 10x to 100x Order Volume Scaling

---

## 1. Production Architecture Overview

The NYUTA ELITE MAKHANA platform is structured as a cloud-native, decoupled e-commerce architecture designed for elastic horizontal scalability:

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client & Edge Layer"]
        UserBrowser["Shopper & Admin Browsers"]
        NetlifyEdge["Netlify Edge CDN (Global Anycast)"]
    end

    subgraph ComputeLayer ["2. Application Compute Layer (Railway)"]
        RailwayLB["Railway Ingress & Load Balancer"]
        API1["Express API Instance 1"]
        API2["Express API Instance 2"]
        APIN["Express API Instance N"]
    end

    subgraph DataLayer ["3. Database & Cache Layer"]
        PgBouncer["Neon PgBouncer Connection Pooler"]
        NeonPrimary[("Neon PostgreSQL Primary (Auto-scaling Compute)")]
        NeonReplica[("Neon Read Replica (Analytics / Reporting)")]
        RedisCache[("Upstash / Railway Redis (Phase 16+ Caching)")]
    end

    subgraph ThirdParty ["4. External Gateways"]
        RazorpayGateway["Razorpay Payment Gateway"]
    end

    UserBrowser --> NetlifyEdge
    NetlifyEdge -->|"Static Assets & SPA"| UserBrowser
    NetlifyEdge -->|"API Requests (api.nutyaelite.com)"| RailwayLB

    RailwayLB --> API1
    RailwayLB --> API2
    RailwayLB --> APIN

    API1 --> PgBouncer
    API2 --> PgBouncer
    APIN --> PgBouncer

    PgBouncer --> NeonPrimary
    NeonPrimary -.->|"Async Replication"| NeonReplica
    API1 -.->|"Optional Read Split"| NeonReplica

    API1 -.->|"Catalog Cache"| RedisCache
    API1 -->|"Checkout & Webhooks"| RazorpayGateway
```

---

## 2. Current Capacity Baselines & Bottlenecks

### 2.1 Current Production Baselines
* **Application Server**: Single Node.js 20 Express container on Railway (1 vCPU, 512 MB – 1 GB RAM).
* **Database**: Neon Serverless PostgreSQL with auto-scaling compute (0.25 to 1.0 Compute Units).
* **Payment Processing**: Direct HTTPS webhooks and server-to-server Razorpay API calls.
* **Throughput Measured**:
  * Public Product Catalog: ~246 requests/sec
  * Cart Operations: ~225 requests/sec
  * Order History: ~221 requests/sec
  * Admin Analytics: ~75 requests/sec

### 2.2 Potential Scaling Bottlenecks
1. **Direct DB Connections**: Direct PostgreSQL connections can exhaust Neon connection limits as Express instances scale out.
2. **Heavy Analytics Queries**: Complex aggregate queries (`/api/admin/analytics/summary`) sharing the same database compute as customer checkout.
3. **Flash Sale Inventory Lock Contention**: High concurrency on the last remaining stock of Makhana packs causing database transaction retry storms.

---

## 3. Horizontal Scaling on Railway (Application Tier)

### 3.1 Stateless Architecture
The backend application is completely stateless:
* **Authentication**: Signed stateless JWT tokens (`Authorization: Bearer <token>`).
* **Session Storage**: No server-side session stores or ephemeral filesystem storage.
* **Coupon & Cart State**: Fully persisted in PostgreSQL.
* **Request Correlation**: Cryptographically random `X-Request-ID` attached to each request.

Because of this stateless design, Railway instances can scale horizontally from **1 to 10+ replicas** with zero session synchronization overhead.

### 3.2 Health Check Probes & Zero-Downtime Rolling Deploys
Railway automatically coordinates zero-downtime blue/green deployments using the probes established in Phase 14:
* **Liveness Probe**: `GET /api/health/live` (Timeout: 2s, Interval: 10s) verifies the Node.js event loop is responsive.
* **Readiness Probe**: `GET /api/health/ready` (Timeout: 5s, Interval: 10s) verifies database connectivity (`SELECT 1`) before routing customer traffic to a newly deployed container.
* **Graceful Termination**: The server catches `SIGTERM` and `SIGINT`, closes listening HTTP sockets, flushes active database transactions within a 15-second grace period, and exits cleanly.

---

## 4. Database Scaling & Neon Connection Pooling (Data Tier)

### 4.1 Neon Serverless Compute Auto-Scaling
Neon automatically scales CPU and memory resources up and down based on load:
* **Off-peak (Night)**: Scales down to 0.25 Compute Units (CU) or suspends compute after 5 minutes of inactivity.
* **Normal Traffic**: 0.5 – 1.0 CU.
* **Peak Festival / Campaign Sales**: Auto-scale upper limit configured to 2.0 – 4.0 CU to handle 10x traffic surges.

### 4.2 PgBouncer Connection Pooling
Prisma creates connection pools per container instance. When running \(N\) Railway instances, total connections can spike to \(N \times 10\).

To prevent connection saturation:
1. **Connection String**: Use Neon's pooled endpoint (`-pooler` host with `?sslmode=require&pgbouncer=true`).
2. **Prisma Connection Limit**: Set connection limit per instance via environment variable:
   ```env
   DATABASE_URL="postgresql://user:password@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/nyuta_elite?sslmode=require&pgbouncer=true&connection_limit=10"
   ```
3. **Transaction Mode**: PgBouncer runs in **Transaction Mode**, recycling PostgreSQL backend connections immediately after Prisma interactive transactions complete.

---

## 5. Edge CDN Caching Strategy (Netlify Tier)

### 5.1 Static Assets & Storefront SPA
Configured via Netlify `public/_headers`:
* **Immutable Chunks**:
  ```http
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
  Vite generates content-hashed filenames (`index-B1x8r09z.js`), allowing assets to be cached indefinitely on global edge nodes.
* **HTML Documents**:
  ```http
  /*
    Cache-Control: public, max-age=0, must-revalidate
  ```
  Ensures browsers always fetch the latest `index.html` after a new release.

### 5.2 Edge Caching for Public Catalog
The backend emits `Cache-Control: public, max-age=60, stale-while-revalidate=30` on `GET /api/products`.
* Netlify Edge nodes cache public product catalog responses for 60 seconds.
* During sudden marketing traffic spikes, 90%+ of catalog read requests are served directly from the Netlify edge CDN cache, shielding Railway and Neon entirely.

---

## 6. Distributed Cache Architecture (Redis Roadmap)

### 6.1 Trigger Conditions for Redis Integration
Redis (Upstash / Railway Redis) should be introduced when any of the following milestones are reached:
1. Public product catalog queries exceed **500 QPS sustained**.
2. Flash sale events where thousands of shoppers view the same SKU simultaneously.
3. Need for distributed rate limiting across multiple Railway instances.

### 6.2 Redis Implementation Blueprint
```typescript
// Proposed Cache-Aside Pattern
export async function getCachedProducts(queryKey: string) {
  const cached = await redis.get(`catalog:${queryKey}`);
  if (cached) return JSON.parse(cached);

  const fresh = await productService.getProducts(...);
  await redis.set(`catalog:${queryKey}`, JSON.stringify(fresh), 'EX', 120);
  return fresh;
}

// Invalidation Hook on Admin Catalog Updates
export async function invalidateCatalogCache() {
  const keys = await redis.keys('catalog:*');
  if (keys.length > 0) await redis.del(...keys);
}
```

---

## 7. Database Read Replica Strategy (Reporting vs. OLTP)

### 7.1 Separation of Concerns
Complex aggregate queries on the Admin Analytics dashboard (`/api/admin/analytics/summary`, revenue grouping, customer LTV) can perform multi-table scans that consume CPU cycles.

### 7.2 Neon Read Replica Architecture
* **Trigger**: Order volume exceeds 5,000 orders/month, or admin analytics queries run frequently during peak daytime checkout hours.
* **Implementation**: Neon supports instant creation of Read-Only compute endpoints attached to the same storage pages.
* **Application Configuration**:
  ```typescript
  // prisma.ts
  export const prismaWrite = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  export const prismaRead = new PrismaClient({ datasourceUrl: process.env.DATABASE_READ_URL || process.env.DATABASE_URL });
  ```
  All `/api/admin/analytics/*` controllers will query `prismaRead`, leaving 100% of the primary database's compute capacity dedicated to checkout transactions and payment verification.

---

## 8. Scaling Milestones & Capacity Roadmap Matrix

| Milestone | Order Volume | Railway Scale | Database Tier | Caching Strategy | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Current (Phase 15)** | Up to 1,000 orders/mo | 1x Railway Starter (512MB) | Neon Free/Launch (0.25 - 1 CU) + PgBouncer | HTTP `Cache-Control` + Netlify Edge CDN | \$5 – \$15 / month |
| **Growth Stage** | 1,000 – 10,000 orders/mo | 2x Railway Pro (1GB) with Auto-scale | Neon Scale Tier (0.5 - 2 CU) + PgBouncer | Netlify Edge + In-memory catalog cache | \$30 – \$60 / month |
| **High Scale / Festivals** | 10,000 – 50,000 orders/mo | 3 – 5x Railway Pro (2GB) | Neon Scale Tier (1 - 4 CU) + Read Replica | Upstash Redis Cache-Aside + Edge CDN | \$80 – \$150 / month |
| **Enterprise Makhana Brand** | 50,000+ orders/mo | 5 – 10x Railway Containers | Neon Multi-branch HA + Dedicated Read Replicas | Distributed Redis Cluster + Redlock Inventory | \$200 – \$400 / month |

---

## 9. Conclusion & Operational Readiness

The NYUTA ELITE MAKHANA platform is fully architected for horizontal expansion. By combining:
* Code-split lightweight frontend delivery,
* Edge HTTP caching for read operations,
* Non-blocking indexed PostgreSQL queries,
* Bounded query execution, and
* Stateless API nodes with PgBouncer connection pooling,

the system is prepared to handle significant traffic spikes with zero architecture redesign.

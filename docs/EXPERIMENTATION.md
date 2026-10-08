# Experimentation & A/B Testing Engine (`NYUTA ELITE MAKHANA`)

## 1. Architecture & Safety Guarantees

The NYUTA ELITE MAKHANA experimentation engine enables controlled product and UX experiments without risking checkout integrity, payment security, or pricing consistency.

### Non-Negotiable Financial Guardrails
- **Prohibited Config Keys:** Variant JSON configurations are recursively validated against forbidden financial/inventory keys (`price`, `amount`, `totalAmount`, `subtotal`, `discount`, `tax`, `shippingFee`, `stock`, `inventory`, `razorpay`, `paymentStatus`, `orderTotal`, `paise`). Any attempt to create an experiment with these keys is rejected with `400 BAD REQUEST`.
- **Allocation Invariant:** Variant `allocationPercent` values must be integers summing to **exact `100`**, and an experiment must define at least 2 variants with **exactly 1 control variant (`isControl: true`)**.
- **Read-Only Financial Boundary:** Experiment assignment, impression tracking, and conversion attribution never mutate `Order`, `Payment`, `Refund`, `Coupon`, `LoyaltyAccount`, or `Product.stock`.

---

## 2. Deterministic Hashing & Persistent Assignment

When a subject (`userId` for authenticated users, or `sessionId` for guests) requests assignment via `POST /api/growth/experiments/:key/assign`:

1. **Existing Assignment Check:** Queries `ExperimentAssignment` by unique composite key `(experimentId, subjectId)`. If found, returns the existing assignment immediately (idempotent).
2. **Deterministic Bucket Calculation:**
   $$\text{bucket} = \text{SHA256}(\text{experimentKey} + \text{":"} + \text{subjectId}) \pmod{100}$$
   Maps `bucket` ($0\dots99$) across cumulative variant `allocationPercent` ranges.
3. **Concurrency-Safe Persistence:** Inserts into `ExperimentAssignment` (`@@unique([experimentId, subjectId])`). Under concurrent requests (`P2002`), gracefully resolves and returns the winning persisted record.

---

## 3. Lifecycle State Machine & Audit Logging

### Valid Statuses (`ExperimentStatus`)
- `DRAFT` $\rightarrow$ `RUNNING` | `CANCELLED`
- `RUNNING` $\rightarrow$ `PAUSED` | `COMPLETED` | `CANCELLED`
- `PAUSED` $\rightarrow$ `RUNNING` | `COMPLETED` | `CANCELLED`
- `COMPLETED` (Terminal)
- `CANCELLED` (Terminal)

Every lifecycle transition (`EXPERIMENT_CREATED`, `STATUS_CHANGED_TO_*`) is atomically recorded in `ExperimentAuditLog` with `adminId`, `action`, `previousStatus`, `newStatus`, `details`, and `createdAt`.

---

## 4. Statistical Evaluation & Sample-Size Guardrails

`GET /api/admin/growth/experiments/:id/results` evaluates variant performance:

1. **Minimum Sample Size Guardrail (`minSampleSize`):**
   - If either the control variant or a treatment variant has `exposures < experiment.minSampleSize` (minimum enforced floor of `30`, default `100`), the engine sets:
     - `statisticalStatus: 'INSUFFICIENT_SAMPLE'`
     - `isSignificant: false`
     - `zScore: null`, `pValue: null`
   - No winner is declared (`winnerVariantKey: null`).
2. **Two-Proportion Z-Test (When Sample Size Is Met):**
   - Pooled conversion probability:
     $$p_{\text{pool}} = \frac{c_1 + c_2}{n_1 + n_2}$$
   - Standard error:
     $$SE = \sqrt{p_{\text{pool}}(1 - p_{\text{pool}})\left(\frac{1}{n_1} + \frac{1}{n_2}\right)}$$
   - Z-statistic and two-tailed $p$-value ($p < 0.05$ required for `STATISTICALLY_SIGNIFICANT`).

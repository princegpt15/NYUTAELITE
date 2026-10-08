# Campaign Operations, Idempotency & Delivery Runbook

## 1. Overview
The **Campaign Engine** allows administrators to design, preview, and execute data-driven communications across Email and WhatsApp. Built with failure isolation, cryptographic idempotency, and frequency capping, the engine ensures customers receive relevant messaging without spam or duplicates.

---

## 2. Campaign Lifecycle State Machine

```
              ┌─────────┐
              │  DRAFT  │
              └────┬────┘
                   │
         Launch / Dispatch
                   │
                   ▼
             ┌──────────┐
             │  ACTIVE  │
             └─────┬────┘
                   │
      Completion of recipient loop
                   │
                   ▼
            ┌───────────┐
            │ COMPLETED │
            └───────────┘
```

- `DRAFT`: Initial creation. Can be edited, previewed with sample customer data, or deleted.
- `SCHEDULED`: Reserved for future calendar-based automation triggers.
- `ACTIVE`: Currently snapshotting audience and dispatching messages. Prevents concurrent duplicate launches.
- `COMPLETED`: Finished processing all recipients. Terminal state; relaunch is strictly blocked.
- `CANCELLED`: Aborted by administrator.

---

## 3. Audience Snapshotting & Idempotency

### Audience Snapshot
When `launchCampaign(campaignId)` is triggered:
1. Target audience segment user IDs are fetched from `customerSegmentationService`.
2. Applied limits (`maxRecipients`) bound the target group.
3. For each recipient, a `CampaignRecipient` record is created with `status = 'PENDING'`.

### Idempotency Keys
Each recipient dispatch creates a unique composite idempotency key:
$$\text{CAMPAIGN}:\langle\text{campaignId}\rangle:\langle\text{userId}\rangle:\langle\text{channel}\rangle$$
- Guarantees that a customer will never receive more than 1 message from the same campaign even in the event of worker retries or crashes.

---

## 4. Consent & Frequency Capping

Before any message is passed to delivery adapters:
1. **Consent Verification**: Evaluates `CustomerPreference`. If `marketingEmailOptIn = false` (or WhatsApp opt-in is false), the recipient status is recorded as `UNSUBSCRIBED` and no message is sent.
2. **Frequency Cap**: Checks if the customer has received $\ge 3$ marketing messages (across all campaigns and cart recoveries) in the last 7 days. If capped, recipient status is recorded as `SKIPPED` with reason `FREQUENCY_CAP_EXCEEDED`.

---

## 5. Failure Isolation

The campaign delivery loop processes recipients sequentially or in micro-batches with strict `try...catch` boundaries:
- If a delivery fails due to SMTP errors, invalid recipient address, or provider timeout, the error is captured in `CampaignRecipient.errorMessage` and marked `FAILED`.
- The loop continues uninterrupted for all subsequent recipients.
- The campaign status is marked `COMPLETED` upon loop completion regardless of individual failures.

---

## 6. Personalization & XSS Prevention

Templates support variables:
- `{{customerName}}`: Customer's preferred name (defaults to "Makhana Lover").
- `{{couponCode}}`: Associated active coupon code.
- `{{ctaUrl}}`: Destination URL including campaign UTM parameters.
- `{{unsubscribeUrl}}`: 1-click unsubscribe endpoint containing cryptographic token.

All substituted values pass through strict HTML entity escaping (`escapeHtml`) to prevent cross-site scripting (XSS) or HTML injection.

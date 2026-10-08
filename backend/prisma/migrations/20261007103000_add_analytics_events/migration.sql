-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "AnalyticsEventType" AS ENUM ('PURCHASE', 'REFUND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "refundId" TEXT,
    "eventType" "AnalyticsEventType" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsEvent_idempotencyKey_key" ON "AnalyticsEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_orderId_eventType_idx" ON "AnalyticsEvent"("orderId", "eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_refundId_idx" ON "AnalyticsEvent"("refundId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

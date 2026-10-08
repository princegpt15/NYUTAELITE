-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CartRecovery" ADD COLUMN     "recoveredOrderId" TEXT;

-- CreateTable
CREATE TABLE "BehavioralEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "productId" TEXT,
    "orderId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "primaryMetric" TEXT NOT NULL,
    "secondaryMetrics" JSONB,
    "trafficPercentage" INTEGER NOT NULL DEFAULT 100,
    "minSampleSize" INTEGER NOT NULL DEFAULT 100,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentVariant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allocationPercentage" INTEGER NOT NULL,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentEvent" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "userId" TEXT,
    "eventName" TEXT NOT NULL,
    "orderId" TEXT,
    "revenuePaise" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAuditLog" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BehavioralEvent_eventName_createdAt_idx" ON "BehavioralEvent"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "BehavioralEvent_productId_eventName_idx" ON "BehavioralEvent"("productId", "eventName");

-- CreateIndex
CREATE INDEX "BehavioralEvent_userId_eventName_idx" ON "BehavioralEvent"("userId", "eventName");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_key_key" ON "Experiment"("key");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "Experiment_createdAt_idx" ON "Experiment"("createdAt");

-- CreateIndex
CREATE INDEX "ExperimentVariant_experimentId_idx" ON "ExperimentVariant"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentVariant_experimentId_key_key" ON "ExperimentVariant"("experimentId", "key");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentId_variantId_idx" ON "ExperimentAssignment"("experimentId", "variantId");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_userId_idx" ON "ExperimentAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_subjectId_key" ON "ExperimentAssignment"("experimentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentEvent_idempotencyKey_key" ON "ExperimentEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ExperimentEvent_experimentId_variantId_eventName_idx" ON "ExperimentEvent"("experimentId", "variantId", "eventName");

-- CreateIndex
CREATE INDEX "ExperimentEvent_assignmentId_idx" ON "ExperimentEvent"("assignmentId");

-- CreateIndex
CREATE INDEX "ExperimentAuditLog_experimentId_createdAt_idx" ON "ExperimentAuditLog"("experimentId", "createdAt");

-- AddForeignKey
ALTER TABLE "ExperimentVariant" ADD CONSTRAINT "ExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ExperimentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ExperimentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAuditLog" ADD CONSTRAINT "ExperimentAuditLog_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

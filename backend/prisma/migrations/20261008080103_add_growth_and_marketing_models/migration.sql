-- CreateEnum
CREATE TYPE "CartRecoveryStatus" AS ENUM ('ELIGIBLE', 'CONTACTED', 'RECOVERED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'UNSUBSCRIBED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "utmCampaign" TEXT;

-- CreateTable
CREATE TABLE "CustomerPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketingEmailOptIn" BOOLEAN NOT NULL DEFAULT true,
    "marketingWhatsAppOptIn" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribeToken" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartRecovery" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CartRecoveryStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "eligibleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "recoveredAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "recoveryToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "audience" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "couponCode" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxRecipients" INTEGER,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "attributedOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "attributedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utmCampaign" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPreference_userId_key" ON "CustomerPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPreference_unsubscribeToken_key" ON "CustomerPreference"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "CartRecovery_idempotencyKey_key" ON "CartRecovery"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CartRecovery_recoveryToken_key" ON "CartRecovery"("recoveryToken");

-- CreateIndex
CREATE INDEX "CartRecovery_userId_status_idx" ON "CartRecovery"("userId", "status");

-- CreateIndex
CREATE INDEX "CartRecovery_status_eligibleAt_idx" ON "CartRecovery"("status", "eligibleAt");

-- CreateIndex
CREATE INDEX "CartRecovery_cartId_idx" ON "CartRecovery"("cartId");

-- CreateIndex
CREATE INDEX "Campaign_status_createdAt_idx" ON "Campaign"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Campaign_audience_idx" ON "Campaign"("audience");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_idempotencyKey_key" ON "CampaignRecipient"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_status_idx" ON "CampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_userId_status_idx" ON "CampaignRecipient"("userId", "status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_channel_idx" ON "CampaignRecipient"("channel");

-- CreateIndex
CREATE INDEX "Order_campaignId_idx" ON "Order"("campaignId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPreference" ADD CONSTRAINT "CustomerPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRecovery" ADD CONSTRAINT "CartRecovery_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartRecovery" ADD CONSTRAINT "CartRecovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

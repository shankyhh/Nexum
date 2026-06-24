-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CA', 'TAXPAYER');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'PENDING', 'FILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'CLOSING', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('GRANTED', 'PENDING', 'DENIED');

-- CreateEnum
CREATE TYPE "RegisterStatus" AS ENUM ('ACTIVE', 'GAP', 'NA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TAXPAYER',
    "gstin" TEXT,
    "pan" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gst_returns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL DEFAULT '{}',
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gst_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itr_returns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "assessmentYear" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL DEFAULT '{}',
    "filedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itr_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT,
    "cin" TEXT,
    "pan" TEXT,
    "industry" TEXT NOT NULL,
    "employees" INTEGER NOT NULL DEFAULT 0,
    "jurisdiction" TEXT NOT NULL DEFAULT 'Karnataka',
    "website" TEXT,
    "engagementStart" TIMESTAMP(3),
    "engagementEnd" TIMESTAMP(3),
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "services" TEXT[],
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskBand" TEXT NOT NULL DEFAULT 'Low',
    "dataCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_assets" (
    "id" TEXT NOT NULL,
    "vaultClientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "categories" TEXT[],
    "classification" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "sensitivity" INTEGER NOT NULL DEFAULT 1,
    "isSdp" BOOLEAN NOT NULL DEFAULT false,
    "storageFolder" TEXT NOT NULL,
    "sharingPolicy" TEXT NOT NULL,
    "retentionTrigger" TEXT NOT NULL,
    "retentionAction" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccess" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposal" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharing_logs" (
    "id" TEXT NOT NULL,
    "dataAssetId" TEXT NOT NULL,
    "vaultClientId" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "sharedWith" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "approval" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sharing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpdp_registers" (
    "id" TEXT NOT NULL,
    "vaultClientId" TEXT NOT NULL,
    "registerType" TEXT NOT NULL,
    "status" "RegisterStatus" NOT NULL DEFAULT 'GAP',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dpdp_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "module" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "gst_returns_userId_status_idx" ON "gst_returns"("userId", "status");
CREATE INDEX "gst_returns_gstin_period_idx" ON "gst_returns"("gstin", "period");
CREATE INDEX "itr_returns_userId_status_idx" ON "itr_returns"("userId", "status");
CREATE INDEX "itr_returns_pan_assessmentYear_idx" ON "itr_returns"("pan", "assessmentYear");
CREATE INDEX "vault_clients_userId_status_idx" ON "vault_clients"("userId", "status");
CREATE INDEX "data_assets_vaultClientId_idx" ON "data_assets"("vaultClientId");
CREATE INDEX "data_assets_classification_idx" ON "data_assets"("classification");
CREATE INDEX "sharing_logs_vaultClientId_idx" ON "sharing_logs"("vaultClientId");
CREATE INDEX "sharing_logs_approval_idx" ON "sharing_logs"("approval");
CREATE UNIQUE INDEX "dpdp_registers_vaultClientId_registerType_key" ON "dpdp_registers"("vaultClientId", "registerType");
CREATE INDEX "ai_conversations_userId_module_idx" ON "ai_conversations"("userId", "module");

-- AddForeignKey
ALTER TABLE "gst_returns" ADD CONSTRAINT "gst_returns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "itr_returns" ADD CONSTRAINT "itr_returns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_clients" ADD CONSTRAINT "vault_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_vaultClientId_fkey" FOREIGN KEY ("vaultClientId") REFERENCES "vault_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sharing_logs" ADD CONSTRAINT "sharing_logs_dataAssetId_fkey" FOREIGN KEY ("dataAssetId") REFERENCES "data_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sharing_logs" ADD CONSTRAINT "sharing_logs_vaultClientId_fkey" FOREIGN KEY ("vaultClientId") REFERENCES "vault_clients"("id") ON UPDATE CASCADE;
ALTER TABLE "dpdp_registers" ADD CONSTRAINT "dpdp_registers_vaultClientId_fkey" FOREIGN KEY ("vaultClientId") REFERENCES "vault_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

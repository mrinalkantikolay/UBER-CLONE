-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUND_PROCESSING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gatewayTransactionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideAnalytics" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "demand" INTEGER NOT NULL,
    "supply" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueAnalytics" (
    "id" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "traceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_rideId_key" ON "Payment"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayTransactionId_key" ON "Payment"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_version_key" ON "NotificationTemplate"("name", "version");

-- CreateIndex
CREATE INDEX "RideAnalytics_city_timestamp_idx" ON "RideAnalytics"("city", "timestamp");

-- CreateIndex
CREATE INDEX "RevenueAnalytics_city_timestamp_idx" ON "RevenueAnalytics"("city", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_traceId_idx" ON "AuditLog"("traceId");

-- CreateIndex
CREATE INDEX "OutboxEvent_published_createdAt_idx" ON "OutboxEvent"("published", "createdAt");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

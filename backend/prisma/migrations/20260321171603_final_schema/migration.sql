/*
  Warnings:

  - You are about to drop the column `success` on the `LoginAttempt` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[licenseNumber]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LoginAttemptType" AS ENUM ('FAILED', 'OTP_PENDING', 'SUCCESS');

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "LoginAttempt" DROP COLUMN "success",
ADD COLUMN     "type" "LoginAttemptType" NOT NULL DEFAULT 'FAILED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Session";

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "DriverDocument_verified_idx" ON "DriverDocument"("verified");

-- CreateIndex
CREATE INDEX "DriverDocument_expiresAt_idx" ON "DriverDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_type_idx" ON "LoginAttempt"("type");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

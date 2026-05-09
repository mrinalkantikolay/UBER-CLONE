-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'RAZORPAY', 'UPI');

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "last4" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `email` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Driver` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `licenseNumber` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'AUTO', 'BIKE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LICENSE', 'REGISTRATION', 'INSURANCE', 'AADHAR', 'PAN');

-- DropIndex
DROP INDEX "Driver_email_idx";

-- DropIndex
DROP INDEX "Driver_email_key";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "licenseNumber" TEXT NOT NULL,
ADD COLUMN     "status" "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_driverId_key" ON "Vehicle"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_idx" ON "DriverDocument"("driverId");

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_type_idx" ON "DriverDocument"("driverId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE INDEX "Driver_userId_idx" ON "Driver"("userId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

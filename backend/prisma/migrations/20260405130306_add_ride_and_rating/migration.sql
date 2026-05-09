-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED_UNPAID', 'COMPLETED_PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destLat" DOUBLE PRECISION NOT NULL,
    "destLng" DOUBLE PRECISION NOT NULL,
    "fare" DOUBLE PRECISION,
    "surgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "cancellationFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "idempotencyKey" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ride_idempotencyKey_key" ON "Ride"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Ride_userId_idx" ON "Ride"("userId");

-- CreateIndex
CREATE INDEX "Ride_driverId_idx" ON "Ride"("driverId");

-- CreateIndex
CREATE INDEX "Ride_status_idx" ON "Ride"("status");

-- CreateIndex
CREATE INDEX "Ride_userId_status_idx" ON "Ride"("userId", "status");

-- CreateIndex
CREATE INDEX "Ride_userId_createdAt_idx" ON "Ride"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_rideId_key" ON "Rating"("rideId");

-- CreateIndex
CREATE INDEX "Rating_driverId_idx" ON "Rating"("driverId");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

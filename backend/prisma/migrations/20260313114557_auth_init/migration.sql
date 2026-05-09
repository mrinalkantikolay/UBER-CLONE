/*
  Warnings:

  - A unique constraint covering the columns `[refreshToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceInfo` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshToken` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "deviceInfo" JSONB NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "refreshToken" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Driver_email_idx" ON "Driver"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_refreshToken_idx" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

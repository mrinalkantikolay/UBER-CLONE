-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userId" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_idx" ON "LoginAttempt"("ip");

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

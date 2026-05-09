-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_refreshToken_idx" ON "Session"("userId", "refreshToken");

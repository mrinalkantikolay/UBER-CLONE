import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import env from "../config/env";
import logger from "../config/logger";

import userModel from "../models/user.model";
import loginAttemptModel from "../models/loginAttempt.model";

import { redisClient } from "../config/redis";
import ApiError from "../utils/ApiError";

import metrics from "../metrics";
import { alertSecurity } from "../utils/securityAlerts";
import auditLogger from "../utils/auditLogger";
import { notificationQueue } from "../queues/notification.queue";

import { User } from "@prisma/client";

/* ======================================================
   TYPES
====================================================== */

export type DeviceInfo = {
  ip: string;
  browser: string;
  os: string;
};

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type RiskLevel = "SAFE" | "HIGH_RISK";

interface JwtPayload {
  id: string;
  type: "access" | "refresh";
  tokenVersion: number;
  tokenId?: string;
  iat: number;
  exp: number;
}

type LoginResult =
  | { user: User; requiresOTP: true; requestId: string }
  | { user: User; requiresOTP: false; accessToken: string; refreshToken: string };

export type LoginAttemptType = "FAILED" | "OTP_PENDING" | "SUCCESS";

/* ======================================================
   CONSTANTS
====================================================== */

const MAX_DEVICES = 5;
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const OTP_TTL = 300;
const OTP_ATTEMPT_LIMIT = 5;
const OTP_GLOBAL_ATTEMPT_LIMIT = 20;
const OTP_GLOBAL_BLOCK_TTL = 24 * 60 * 60;
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW = 60;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const DEVICE_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_BATCH_DELETE = 100;
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW = 3600;

/* ======================================================
   REDIS KEY FACTORY
====================================================== */

const Keys = {
  loginRate: (ip: string, email: string) => `login_rate:${ip}:${email}`,
  signupRate: (ip: string) => `signup_rate:${ip}`,
  otp: (email: string, requestId: string) => `otp:${email}:${requestId}`,
  otpAttempts: (email: string, requestId: string) => `otp_attempts:${email}:${requestId}`,
  otpGlobalAttempts: (email: string) => `otp_global_attempts:${email}`,
  otpGlobalBlock: (email: string) => `otp_global_block:${email}`,
  otpRate: (email: string) => `otp_rate:${email}`,
  pendingDevice: (email: string, requestId: string) => `pending_device:${email}:${requestId}`,
  userPendingDevices: (userId: string) => `user_pending_devices:${userId}`,
  refreshToken: (userId: string, tokenId: string) => `refresh:${userId}:${tokenId}`,
  sessions: (userId: string) => `user_sessions:${userId}`,
  devices: (userId: string) => `user_devices:${userId}`,
  blacklist: (token: string) => `access_blacklist:${token}`,
  userCache: (userId: string) => `user_profile:${userId}`,
};

/* ======================================================
   TRACE ID
   Auto-generates a fallback UUID when the caller does not
   provide one. Every function call is traceable regardless
   of whether the controller passes a traceId.
   O(1) per call.
====================================================== */

const ensureTraceId = (traceId?: string): string =>
  traceId ?? crypto.randomUUID();

/* ======================================================
   PASSWORD STRENGTH
   Gap 6 fix — enforced at service layer, not only in the
   HTTP validator. Protects against direct service calls,
   internal service-to-service calls, and test harnesses.
   Rules: min 8 chars, must contain uppercase, lowercase,
   digit, and special character (3 of 4 categories).
   O(1) per call.
====================================================== */

const PASSWORD_RULES = [
  /[A-Z]/,
  /[a-z]/,
  /[0-9]/,
  /[^A-Za-z0-9]/,
];

const assertPasswordStrength = (password: string): void => {
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;

  if (passed < 3) {
    throw new ApiError(
      400,
      "Password must contain at least 3 of: uppercase letter, lowercase letter, number, special character"
    );
  }
};

/* ======================================================
   SAFE WRAPPERS
   Metrics, audit, and security alerts never crash the
   auth flow. Failures are logged at the appropriate level
   so monitoring can detect broken observability pipelines.
====================================================== */

const safeMetric = (fn: () => void, name: string): void => {
  try {
    fn();
  } catch (err) {
    logger.warn({ err, metric: name }, "Metrics call failed — non-blocking");
  }
};

const safeAudit = (
  event: string,
  payload: Record<string, unknown>,
  traceId: string
): void => {
  try {
    auditLogger(event, { ...payload, traceId });
  } catch (err) {
    logger.error(
      { err, event, payload, traceId },
      "AUDIT LOG FAILED — security event may be missing from audit trail"
    );
  }
};

const safeAlert = (
  event: string,
  payload: Record<string, unknown>
): void => {
  try {
    alertSecurity(event, payload);
  } catch (err) {
    logger.error(
      { err, event, payload },
      "SECURITY ALERT FAILED — alert may not have been delivered"
    );
  }
};

/* ======================================================
   OTP DELIVERY
   Gap 4 fix — OTP is actually delivered in production.
   Attempts SMS first (higher delivery rate for OTPs).
   Falls back to email if SMS provider is unavailable or
   phone number is not on record.
   Both failures are logged at ERROR — OTP delivery failure
   is a critical event that must be visible in monitoring.
   O(1) per call.
====================================================== */

const deliverOTP = async (
  email: string,
  phone: string | null,
  otp: string,
  traceId: string
): Promise<void> => {
  try {
    /* 
     * Push job to BullMQ. The server does not wait for the email/SMS 
     * to actually send before responding to the user.
     * BullMQ will retry 3 times if Twilio/SendGrid fails.
     */
    await notificationQueue.add("send-otp", {
      userId: "", // Not strictly needed for OTP
      email,
      phone,
      otp,
      traceId,
    });

    logger.info({ traceId, email }, "OTP delivery job queued to BullMQ");
  } catch (err) {
    logger.error({ err, traceId }, "Failed to queue OTP job to BullMQ");
    throw new ApiError(503, "OTP delivery failed to queue. Please try again.");
  }
};

/* ======================================================
   PIPELINE EXECUTOR
   node-redis v4 pipeline.exec() returns ReplyUnion[].
   Errors throw as exceptions — not returned as tuples.
   O(n) where n = number of pipeline commands.
====================================================== */

const execPipeline = async (
  pipeline: ReturnType<typeof redisClient.multi>,
  expectedLength: number,
  context: string,
  traceId: string
): Promise<any[]> => {
  let results: any[];

  try {
    results = await pipeline.exec();
  } catch (err) {
    logger.error({ context, err, traceId }, "Redis pipeline exec threw an error");
    throw new ApiError(500, "Cache operation failed");
  }

  if (results === null) {
    logger.error({ context, traceId }, "Redis pipeline aborted — returned null");
    throw new ApiError(500, "Cache operation failed");
  }

  if (results.length !== expectedLength) {
    logger.error(
      { context, expected: expectedLength, received: results.length, traceId },
      "Redis pipeline returned unexpected number of results"
    );
    throw new ApiError(500, "Cache operation failed");
  }

  return results;
};

/* ======================================================
   SAFE BATCH DELETE
   O(n) chunked at MAX_BATCH_DELETE = 100.
====================================================== */

const safeBatchDelete = async (
  keys: string[],
  context: string
): Promise<void> => {
  if (keys.length === 0) return;

  if (keys.length > MAX_BATCH_DELETE) {
    logger.warn(
      { context, count: keys.length },
      "Batch delete exceeds safety cap — splitting into chunks"
    );
  }

  for (let i = 0; i < keys.length; i += MAX_BATCH_DELETE) {
    await redisClient.del(keys.slice(i, i + MAX_BATCH_DELETE));
  }
};

/* ======================================================
   USER CACHE INVALIDATION
   Centralised — all callers use Keys.userCache so the
   pattern always matches what User Service writes.
   Non-blocking — cache miss is always safe.
   O(1) per call.
====================================================== */

const invalidateUserCache = async (
  userId: string,
  traceId: string
): Promise<void> => {
  try {
    await redisClient.del(Keys.userCache(userId));
  } catch (err) {
    logger.warn({ err, userId, traceId }, "Failed to invalidate user cache — non-blocking");
  }
};

/* ======================================================
   TOKEN GENERATION
   tokenVersion embedded in both token types.
   Password reset increments version — both invalidated.
   O(1) per call.
====================================================== */

const generateAccessToken = (
  userId: string,
  tokenVersion: number
): string => {
  return jwt.sign(
    { id: userId, type: "access", tokenVersion },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TTL_SECONDS,
      issuer: "auth-service",
      audience: "uber-clone",
    }
  );
};

const generateRefreshToken = (
  userId: string,
  tokenVersion: number
) => {
  const tokenId = crypto.randomBytes(16).toString("hex");

  const refreshToken = jwt.sign(
    { id: userId, tokenId, type: "refresh", tokenVersion },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TTL_SECONDS,
      issuer: "auth-service",
      audience: "uber-clone",
    }
  );
  return { refreshToken, tokenId };
};

/* ======================================================
   JWT VERIFICATION
   Separates key resolution failures from signature failures.
   Both are logged with distinct context for monitoring.
   O(1) per call.
====================================================== */

const verifyJwt = (
  token: string,
  type: "access" | "refresh",
  traceId: string
): JwtPayload => {
  const secret = type === "access"
    ? env.JWT_ACCESS_SECRET
    : env.JWT_REFRESH_SECRET;

  try {
    return jwt.verify(token, secret, {
      issuer: "auth-service",
      audience: "uber-clone",
    }) as JwtPayload;
  } catch (err) {
    logger.warn({ err, type, traceId }, "JWT verification failed");
    throw new ApiError(401, "Invalid or expired token");
  }
};

/* ======================================================
   PASSWORD UTILITIES
====================================================== */

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/* ======================================================
   RATE LIMITING
   signup:  per IP,       5 per hour
   login:   per IP+email, 10 per minute
   otp:     per email,    3 per 60 seconds
   All fail-closed — Redis down rejects the request.
   O(1) per call — atomic Lua INCR + EXPIRE.
====================================================== */

/*
 * Atomic Lua: INCR + conditional EXPIRE in a single round-trip.
 * Eliminates the race condition where a crash between INCR and
 * EXPIRE would leave a key that never expires.
 */
const RATE_LIMIT_SCRIPT = `
  local key    = KEYS[1]
  local window = tonumber(ARGV[1])
  local count  = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, window)
  end
  return count
`;

const checkSignupRateLimit = async (
  ip: string,
  traceId: string
): Promise<void> => {
  // Dev-only bypass
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true') return;

  if (!redisClient.isReady) {
    logger.error({ traceId }, "Redis unavailable — REJECTING signup (fail-closed)");
    throw new ApiError(503, "Service temporarily unavailable");
  }

  const key = Keys.signupRate(ip);
  const attempts = await redisClient.eval(RATE_LIMIT_SCRIPT, {
    keys: [key],
    arguments: [String(SIGNUP_RATE_WINDOW)],
  }) as number;

  if (attempts > SIGNUP_RATE_LIMIT) {
    throw new ApiError(429, "Too many signup attempts. Try again later.");
  }
};

const checkLoginRateLimit = async (
  ip: string,
  email: string,
  traceId: string
): Promise<void> => {
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true') return;
  if (!redisClient.isReady) {
    logger.error({ traceId }, "Redis unavailable — REJECTING login (fail-closed)");
    throw new ApiError(503, "Service temporarily unavailable");
  }

  const key = Keys.loginRate(ip, email);
  const attempts = await redisClient.eval(RATE_LIMIT_SCRIPT, {
    keys: [key],
    arguments: ["60"],
  }) as number;

  if (attempts > 10) {
    throw new ApiError(429, "Too many login attempts. Try again later.");
  }
};

const checkOTPRateLimit = async (
  email: string,
  traceId: string
): Promise<void> => {
  if (process.env.DEV_SKIP_RATE_LIMIT === 'true') return;
  if (!redisClient.isReady) {
    logger.error({ traceId }, "Redis unavailable — REJECTING OTP request (fail-closed)");
    throw new ApiError(503, "Service temporarily unavailable");
  }

  const key = Keys.otpRate(email);
  const attempts = await redisClient.eval(RATE_LIMIT_SCRIPT, {
    keys: [key],
    arguments: [String(OTP_RATE_WINDOW)],
  }) as number;

  if (attempts > OTP_RATE_LIMIT) {
    throw new ApiError(429, "Too many OTP requests. Wait 60 seconds before retrying.");
  }
};

/* ======================================================
   ACCOUNT LOCKOUT
   O(1) — single DB read + conditional update.
====================================================== */

const checkAccountLock = async (user: {
  id: string;
  lockedUntil: Date | null;
  failedAttempts: number;
}): Promise<void> => {
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
    );
    throw new ApiError(423, `Account locked. Try again in ${remaining} minute(s)`);
  }

  if (user.lockedUntil && new Date(user.lockedUntil) <= new Date()) {
    await userModel.resetFailedAttempts(user.id);
  }
};

const handleFailedLogin = async (
  userId: string,
  _failedAttempts: number
): Promise<void> => {
  const updated = await userModel.incrementFailedAttempts(userId);

  if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    await userModel.lockAccount(userId, lockUntil);
    logger.warn({ userId }, `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts`);
  }
};

/* ======================================================
   DEVICE FINGERPRINTING
   Device identity = browser + OS only.
   IP excluded — mobile users switch IPs constantly.
   IP is logged separately for forensic analysis.
   O(1) — single SHA-256 hash.
====================================================== */

export const hashDeviceId = (deviceInfo: DeviceInfo): string => {
  const raw = `${deviceInfo.browser}|${deviceInfo.os}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

const assessLoginRisk = async (
  userId: string,
  deviceInfo: DeviceInfo
): Promise<RiskLevel> => {
  if (!redisClient.isReady) {
    logger.error("Redis unavailable — assessLoginRisk returning HIGH_RISK (fail-closed)");
    return "HIGH_RISK";
  }

  const key = Keys.devices(userId);
  const deviceId = hashDeviceId(deviceInfo);

  const score = await redisClient.zScore(key, deviceId);
  if (score !== null) return "SAFE";

  const count = await redisClient.zCard(key);
  if (count === 0) return "HIGH_RISK";

  return "HIGH_RISK";
};

/*
 * Atomic Lua: ZADD + EXPIRE + conditional ZPOPMIN.
 * Single round trip. No partial writes possible.
 * O(log n), n ≤ MAX_DEVICES = 5.
 */
const STORE_DEVICE_SCRIPT = `
  local key     = KEYS[1]
  local score   = tonumber(ARGV[1])
  local member  = ARGV[2]
  local ttl     = tonumber(ARGV[3])
  local maxSize = tonumber(ARGV[4])

  redis.call('ZADD', key, score, member)
  redis.call('EXPIRE', key, ttl)

  local count = redis.call('ZCARD', key)
  if count > maxSize then
    redis.call('ZPOPMIN', key, count - maxSize)
  end

  return count
`;

const storeDevice = async (
  userId: string,
  deviceInfo: DeviceInfo
): Promise<void> => {
  if (!redisClient.isReady) return;

  await redisClient.eval(STORE_DEVICE_SCRIPT, {
    keys: [Keys.devices(userId)],
    arguments: [
      String(Date.now()),
      hashDeviceId(deviceInfo),
      String(DEVICE_TTL_SECONDS),
      String(MAX_DEVICES),
    ],
  });
};

/* ======================================================
   SESSION MANAGEMENT
   Insert-first then evict — correct under concurrency.
   Pre-insert check allows two parallel requests to both
   skip eviction. Post-insert eviction always accurate.
   >= MAX_DEVICES threshold maintains hard cap of exactly
   MAX_DEVICES after insert.

   Complexity:
     storeRefreshToken → O(log n) via pipeline
     evictOldSessions  → O(log n) ZPOPMIN
     verifyRefreshToken → O(1) GET
     revokeRefreshToken → O(log n) ZREM + O(1) DEL
====================================================== */

const evictOldSessions = async (userId: string): Promise<void> => {
  if (!redisClient.isReady) return;

  const sessionKey = Keys.sessions(userId);
  const count = await redisClient.zCard(sessionKey);

  if (count >= MAX_DEVICES) {
    const oldest = await redisClient.zPopMin(sessionKey);
    if (oldest) {
      await redisClient.del(Keys.refreshToken(userId, oldest.value));
    }
  }
};

const storeRefreshToken = async (
  userId: string,
  tokenId: string,
  deviceInfo: DeviceInfo,
  traceId: string
): Promise<void> => {
  if (!redisClient.isReady) {
    throw new ApiError(503, "Auth service unavailable");
  }

  const value = JSON.stringify({
    userId,
    tokenId,
    deviceInfo,
    createdAt: new Date().toISOString(),
  });

  const pipeline = redisClient.multi();
  pipeline.setEx(Keys.refreshToken(userId, tokenId), REFRESH_TTL_SECONDS, value);
  pipeline.zAdd(Keys.sessions(userId), { score: Date.now(), value: tokenId });
  await execPipeline(pipeline, 2, "storeRefreshToken", traceId);

  await evictOldSessions(userId);
};

const verifyRefreshToken = async (userId: string, tokenId: string) => {
  if (!redisClient.isReady) return null;
  const data = await redisClient.get(Keys.refreshToken(userId, tokenId));
  if (!data) return null;
  return JSON.parse(data);
};

const revokeRefreshToken = async (
  userId: string,
  tokenId: string
): Promise<void> => {
  if (!redisClient.isReady) return;
  await redisClient.del(Keys.refreshToken(userId, tokenId));
  await redisClient.zRem(Keys.sessions(userId), tokenId);
};

/* ======================================================
   TOKEN BLACKLIST
   O(1) — SET with TTL = token's remaining lifetime.
   jwt.decode never throws — safe to call unconditionally.
====================================================== */

const blacklistAccessToken = async (token: string): Promise<void> => {
  if (!redisClient.isReady) return;

  const decoded: any = jwt.decode(token);
  if (!decoded?.exp) return;

  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redisClient.setEx(Keys.blacklist(token), ttl, "revoked");
  }
};

export const isAccessTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!redisClient.isReady) return false;
  const exists = await redisClient.get(Keys.blacklist(token));
  return !!exists;
};

/* ======================================================
   OTP SYSTEM

   Security model:
     1. 24h block checked FIRST — survives counter TTL expiry
     2. Global counter incremented BEFORE OTP check
        — expired OTP still burns from the global budget
     3. Per-requestId counter scopes attempts to one session
     4. pending_device deleted on EVERY failure path
     5. Global counter NOT deleted on success — expires via TTL
     6. OTP is actually delivered via SMS or email in production

   Complexity: O(1) per operation.
====================================================== */

export const sendOTP = async (
  email: string,
  requestId: string,
  phone: string | null,
  traceId: string
): Promise<void> => {
  if (!redisClient.isReady) {
    throw new ApiError(503, "OTP service unavailable");
  }

  await checkOTPRateLimit(email, traceId);

  const otp = crypto.randomInt(100000, 999999).toString();

  const pipeline = redisClient.multi();
  pipeline.del(Keys.otpAttempts(email, requestId));
  pipeline.setEx(Keys.otp(email, requestId), OTP_TTL, otp);
  await execPipeline(pipeline, 2, "sendOTP", traceId);

  if (env.NODE_ENV !== "production") {
    logger.info({ email, requestId, otp, traceId }, "DEV ONLY — OTP generated");
    return;
  }

  await deliverOTP(email, phone, otp, traceId);
};

export const verifyOTP = async (
  email: string,
  requestId: string,
  otp: string,
  traceId: string
): Promise<true> => {
  if (!redisClient.isReady) {
    throw new ApiError(503, "OTP service unavailable");
  }

  /* Step 1 — Persistent 24h block. O(1) GET */
  const blockKey = Keys.otpGlobalBlock(email);
  const isBlocked = await redisClient.get(blockKey);

  if (isBlocked) {
    const ttl = await redisClient.ttl(blockKey);
    logger.warn({ email, requestId, ttl, traceId }, "OTP blocked — 24h block active");
    safeMetric(() => metrics.otpBlocked.inc(), "otpBlocked");
    throw new ApiError(
      429,
      `Account temporarily blocked. Try again in ${Math.ceil(ttl / 3600)} hour(s).`
    );
  }

  /* Step 2 — Global counter always incremented first. O(1) INCR */
  const globalKey = Keys.otpGlobalAttempts(email);
  const globalAttempts = await redisClient.incr(globalKey);

  if (globalAttempts === 1) await redisClient.expire(globalKey, OTP_TTL);

  if (globalAttempts > OTP_GLOBAL_ATTEMPT_LIMIT) {
    await redisClient.del(Keys.pendingDevice(email, requestId));
    await redisClient.setEx(blockKey, OTP_GLOBAL_BLOCK_TTL, "blocked");
    logger.warn(
      { email, requestId, globalAttempts, traceId },
      "OTP global attempt limit exceeded — 24h block applied"
    );
    safeMetric(() => metrics.otpBlocked.inc(), "otpBlocked");
    throw new ApiError(429, "Too many OTP attempts. Account blocked for 24 hours.");
  }

  /* Step 3 — Per-requestId counter. O(1) INCR */
  const attemptKey = Keys.otpAttempts(email, requestId);
  const attempts = await redisClient.incr(attemptKey);

  if (attempts === 1) await redisClient.expire(attemptKey, OTP_TTL);

  if (attempts > OTP_ATTEMPT_LIMIT) {
    await redisClient.del(Keys.pendingDevice(email, requestId));
    throw new ApiError(429, "Too many OTP attempts. Request a new OTP.");
  }

  /* Step 4 — OTP existence check. O(1) GET */
  const stored = await redisClient.get(Keys.otp(email, requestId));

  if (!stored) {
    await redisClient.del(Keys.pendingDevice(email, requestId));
    safeMetric(() => metrics.otpFailure.inc(), "otpFailure");
    throw new ApiError(400, "OTP expired. Please request a new one.");
  }

  /* Step 5 — Value match */
  if (stored !== otp) {
    await redisClient.del(Keys.pendingDevice(email, requestId));
    safeMetric(() => metrics.otpFailure.inc(), "otpFailure");
    throw new ApiError(400, "Invalid OTP");
  }

  /* Step 6 — Cleanup. Global counter expires via TTL — not deleted. */
  const cleanupPipeline = redisClient.multi();
  cleanupPipeline.del(Keys.otp(email, requestId));
  cleanupPipeline.del(attemptKey);
  await execPipeline(cleanupPipeline, 2, "verifyOTP cleanup", traceId);

  return true;
};

/*
 * Gap 5 fix — admin can unlock a blocked email.
 * Exported so an admin controller can call it.
 * Clears both the block key and the global attempt counter
 * so the user gets a completely fresh slate.
 * O(1) — two DEL calls.
 */
export const unlockOTPBlock = async (
  email: string,
  adminId: string,
  traceId?: string
): Promise<{ message: string }> => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Service temporarily unavailable");
  }

  const pipeline = redisClient.multi();
  pipeline.del(Keys.otpGlobalBlock(email));
  pipeline.del(Keys.otpGlobalAttempts(email));
  await execPipeline(pipeline, 2, "unlockOTPBlock", tid);

  safeAudit("admin:otp_block_lifted", { email, adminId }, tid);
  logger.info({ email, adminId, traceId: tid }, "OTP block lifted by admin");

  return { message: "OTP block lifted successfully" };
};

/* ======================================================
   AUTH OPERATIONS
====================================================== */

export const signup = async (
  { name, email, password }: SignupInput,
  deviceInfo: DeviceInfo,
  traceId?: string
): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
  requiresOTP: false;
}> => {
  const tid = ensureTraceId(traceId);

  /* Gap 6 fix — password strength at service layer */
  assertPasswordStrength(password);

  /* Gap 2 fix — signup rate limit per IP */
  await checkSignupRateLimit(deviceInfo.ip, tid);

  const existing = await userModel.findByEmail(email);
  if (existing) throw new ApiError(409, "User already exists");

  const hashed = await hashPassword(password);
  const user = await userModel.createUser({ name, email, password: hashed });

  const accessToken = generateAccessToken(user.id, user.tokenVersion);
  const { refreshToken, tokenId } = generateRefreshToken(user.id, user.tokenVersion);

  await storeRefreshToken(user.id, tokenId, deviceInfo, tid);
  await storeDevice(user.id, deviceInfo);

  safeAudit("signup", { userId: user.id, email: user.email }, tid);

  return { user, accessToken, refreshToken, requiresOTP: false };
};

export const login = async (
  { email, password }: { email: string; password: string },
  ip: string,
  deviceInfo: DeviceInfo,
  traceId?: string
): Promise<LoginResult> => {
  const tid = ensureTraceId(traceId);

  await checkLoginRateLimit(ip, email, tid);

  const user = await userModel.findByEmail(email);
  if (!user) throw new ApiError(401, "Invalid credentials");

  await checkAccountLock(user);

  const match = await comparePassword(password, user.password);
  if (!match) {
    await loginAttemptModel.recordAttempt({ email, ip, type: "FAILED" });
    await handleFailedLogin(user.id, user.failedAttempts);
    safeMetric(() => metrics.loginFailure.inc(), "loginFailure");
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.failedAttempts > 0) {
    await userModel.resetFailedAttempts(user.id);
  }

  const risk = await assessLoginRisk(user.id, deviceInfo);

  logger.info(
    { userId: user.id, risk, ip, deviceId: hashDeviceId(deviceInfo), traceId: tid },
    "Login risk assessed"
  );

  if (risk === "HIGH_RISK") {

    if (!redisClient.isReady) {
      throw new ApiError(503, "Auth service unavailable");
    }

    const requestId = crypto.randomBytes(12).toString("hex");

    /* sendOTP now receives phone for SMS delivery */
    await sendOTP(email, requestId, user.phone ?? null, tid);

    const pipeline = redisClient.multi();
    pipeline.setEx(
      Keys.pendingDevice(email, requestId),
      OTP_TTL,
      JSON.stringify(deviceInfo)
    );
    pipeline.sAdd(Keys.userPendingDevices(user.id), requestId);
    pipeline.expire(Keys.userPendingDevices(user.id), OTP_TTL);
    await execPipeline(pipeline, 3, "login HIGH_RISK pendingDevice", tid);

    await loginAttemptModel.recordAttempt({ email, ip, type: "OTP_PENDING" });
    safeMetric(() => metrics.otpRequested.inc(), "otpRequested");

    logger.info(
      { userId: user.id, requestId, ip, traceId: tid },
      "HIGH_RISK login — OTP sent, no tokens issued"
    );

    return { user, requiresOTP: true, requestId };
  }

  await loginAttemptModel.recordAttempt({ email, ip, type: "SUCCESS" });
  safeMetric(() => metrics.loginSuccess.inc(), "loginSuccess");

  const accessToken = generateAccessToken(user.id, user.tokenVersion);
  const { refreshToken, tokenId } = generateRefreshToken(user.id, user.tokenVersion);

  await storeRefreshToken(user.id, tokenId, deviceInfo, tid);
  await storeDevice(user.id, deviceInfo);
  await invalidateUserCache(user.id, tid);

  safeAudit("login:success", { userId: user.id, ip }, tid);

  return { user, accessToken, refreshToken, requiresOTP: false };
};

export const confirmDevice = async (
  userId: string,
  deviceInfo: DeviceInfo
): Promise<void> => {
  await storeDevice(userId, deviceInfo);
  logger.info(
    { userId, deviceId: hashDeviceId(deviceInfo) },
    "New device confirmed via OTP"
  );
};

export const completeOTPLogin = async (
  email: string,
  requestId: string,
  otp: string,
  traceId?: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Auth service unavailable");
  }

  /* Fetch user BEFORE consuming OTP — no OTP burned on deleted account */
  const user = await userModel.findByEmail(email);
  if (!user) throw new ApiError(404, "User not found");

  await verifyOTP(email, requestId, otp, tid);

  /*
   * verifyOTP deletes pendingDevice on every failure path.
   * On success it does NOT delete it — we fetch it here
   * then delete it in the cleanup pipeline below.
   */
  const pendingRaw = await redisClient.get(
    Keys.pendingDevice(email, requestId)
  );

  if (!pendingRaw) {
    throw new ApiError(400, "OTP session expired. Please login again.");
  }

  let deviceInfo: DeviceInfo;

  try {
    deviceInfo = JSON.parse(pendingRaw);
  } catch {
    await redisClient.del(Keys.pendingDevice(email, requestId));
    throw new ApiError(500, "Session data corrupted. Please login again.");
  }

  await confirmDevice(user.id, deviceInfo);

  const accessToken = generateAccessToken(user.id, user.tokenVersion);
  const { refreshToken, tokenId } = generateRefreshToken(user.id, user.tokenVersion);
  await storeRefreshToken(user.id, tokenId, deviceInfo, tid);

  const cleanupPipeline = redisClient.multi();
  cleanupPipeline.del(Keys.pendingDevice(email, requestId));
  cleanupPipeline.sRem(Keys.userPendingDevices(user.id), requestId);
  await execPipeline(cleanupPipeline, 2, "completeOTPLogin cleanup", tid);

  await loginAttemptModel.recordAttempt({
    email,
    ip: deviceInfo.ip,
    type: "SUCCESS",
  });

  safeMetric(() => metrics.loginSuccess.inc(), "loginSuccess");
  await invalidateUserCache(user.id, tid);
  safeAudit("login:otp_verified", { userId: user.id, requestId }, tid);

  logger.info(
    { userId: user.id, requestId, traceId: tid },
    "OTP verified — device confirmed, tokens issued"
  );

  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (
  refreshToken: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  safeMetric(() => metrics.refreshRequests.inc(), "refreshRequests");

  const decoded = verifyJwt(refreshToken, "refresh", tid);

  if (decoded.type !== "refresh") {
    throw new ApiError(401, "Invalid token type — refresh token required");
  }

  const user = await userModel.findById(decoded.id);
  if (!user) throw new ApiError(404, "User not found");

  if (decoded.tokenVersion !== user.tokenVersion) {
    await logoutAll(decoded.id, user.email, tid);
    logger.warn(
      {
        userId: user.id,
        decodedVersion: decoded.tokenVersion,
        currentVersion: user.tokenVersion,
        traceId: tid,
      },
      "Token version mismatch — password reset detected"
    );
    throw new ApiError(401, "Token invalidated due to password change. Please login again.");
  }

  if (!decoded.tokenId) {
    throw new ApiError(401, "Invalid refresh token — missing token identifier");
  }

  const tokenData = await verifyRefreshToken(decoded.id, decoded.tokenId);

  if (!tokenData) {
    safeAlert("refresh_reuse", { userId: decoded.id, tokenId: decoded.tokenId, traceId: tid });
    await logoutAll(decoded.id, user.email, tid);
    throw new ApiError(403, "Token reuse detected — all sessions revoked");
  }

  await revokeRefreshToken(decoded.id, decoded.tokenId);

  const accessToken = generateAccessToken(decoded.id, user.tokenVersion);
  const { refreshToken: newRefresh, tokenId } = generateRefreshToken(
    decoded.id,
    user.tokenVersion
  );

  await storeRefreshToken(decoded.id, tokenId, tokenData.deviceInfo, tid);

  return { accessToken, refreshToken: newRefresh };
};

/* ======================================================
   PASSWORD RESET
====================================================== */

export const resetPassword = async (
  email: string,
  requestId: string,
  otp: string,
  newPassword: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Auth service unavailable");
  }

  /* Gap 6 fix — password strength at service layer */
  assertPasswordStrength(newPassword);

  /* Fetch user first — do not consume OTP if user does not exist */
  const user = await userModel.findByEmail(email);
  if (!user) throw new ApiError(404, "User not found");

  await verifyOTP(email, requestId, otp, tid);

  const hashedPassword = await hashPassword(newPassword);

  /*
   * Atomic DB write — password update + version increment.
   * All existing access and refresh tokens immediately invalid.
   */
  await userModel.updatePasswordAndIncrementVersion(user.id, hashedPassword);

  /* emailHint passed — no extra DB call inside logoutAll */
  await logoutAll(user.id, user.email, tid);

  safeAudit("password_reset", { userId: user.id, email: user.email }, tid);

  return { message: "Password reset successful" };
};

/* ======================================================
   LOGOUT
====================================================== */

export const logout = async (
  accessToken: string,
  refreshToken: string,
  traceId?: string
): Promise<{ message: string }> => {
  const tid = ensureTraceId(traceId);

  await blacklistAccessToken(accessToken);

  try {
    const decoded = verifyJwt(refreshToken, "refresh", tid);
    if (decoded.tokenId) {
      await revokeRefreshToken(decoded.id, decoded.tokenId);
      safeAudit("logout", { userId: decoded.id, tokenId: decoded.tokenId }, tid);
    }
  } catch (error) {
    logger.warn(
      { err: error, traceId: tid },
      "Logout: refresh token invalid/expired — skipping revocation"
    );
  }

  return { message: "Logout successful" };
};

/*
 * emailHint avoids an extra DB call when the caller already
 * has the user object. Internal callers always pass emailHint.
 * External callers (admin, background jobs) may omit it —
 * logoutAll falls back to a DB fetch in that case.
 *
 * Complexity: O(n), n = active sessions ≤ MAX_DEVICES = 5.
 */
export const logoutAll = async (
  userId: string,
  emailHint?: string,
  traceId?: string
): Promise<{ message: string }> => {
  const tid = ensureTraceId(traceId);

  if (!redisClient.isReady) {
    throw new ApiError(503, "Auth service unavailable");
  }

  const sessionKey = Keys.sessions(userId);
  const tokenIds = await redisClient.zRange(sessionKey, 0, -1);

  if (tokenIds.length > 0) {
    const refreshKeys = tokenIds.map((tokenId) => Keys.refreshToken(userId, tokenId));
    await safeBatchDelete(refreshKeys, "logoutAll refreshTokens");
  }

  await redisClient.del(sessionKey);
  await redisClient.del(Keys.devices(userId));

  const email = emailHint ?? (await userModel.findById(userId))?.email;

  if (email) {
    const pendingSetKey = Keys.userPendingDevices(userId);
    const requestIds = await redisClient.sMembers(pendingSetKey);

    if (requestIds.length > 0) {
      const pendingKeys = requestIds.map((rid) => Keys.pendingDevice(email, rid));
      await safeBatchDelete([...pendingKeys, pendingSetKey], "logoutAll pendingDevices");
    } else {
      await redisClient.del(pendingSetKey);
    }
  }

  await invalidateUserCache(userId, tid);

  return { message: "Logged out from all devices" };
};
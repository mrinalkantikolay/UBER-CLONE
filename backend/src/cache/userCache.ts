import { redisClient } from "../config/redis";
import logger from "../config/logger";

const USER_CACHE_TTL = 60 * 5; // 5 minutes
const USER_CACHE_PREFIX = "user_profile"; // must match Keys.userCache() in auth.service.ts

/*
 * Fields safe to cache in Redis.
 * NEVER cache: password, failedAttempts, lockedUntil, tokenVersion.
 * These are security-sensitive — if Redis is compromised, password
 * hashes and lockout state must not be exposed.
 */
const SAFE_CACHE_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "profilePhotoUrl",
  "isActive",
  "createdAt",
  "updatedAt",
] as const;

const stripSensitiveFields = (user: Record<string, unknown>): Record<string, unknown> => {
  const safe: Record<string, unknown> = {};
  for (const key of SAFE_CACHE_FIELDS) {
    if (key in user) {
      safe[key] = user[key];
    }
  }
  return safe;
};

export const getCachedUserById = async (id: string): Promise<Record<string, unknown> | null> => {
  if (!redisClient.isReady) return null;
  try {
    const data = await redisClient.get(`${USER_CACHE_PREFIX}:${id}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.debug({ err }, "userCache get error");
    return null;
  }
};

export const setCachedUser = async (id: string, payload: Record<string, unknown>): Promise<void> => {
  if (!redisClient.isReady) return;
  try {
    const safe = stripSensitiveFields(payload);
    await redisClient.setEx(`${USER_CACHE_PREFIX}:${id}`, USER_CACHE_TTL, JSON.stringify(safe));
  } catch (err) {
    logger.debug({ err }, "userCache set error");
  }
};

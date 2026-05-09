import { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";
import logger from "../config/logger";
import ApiError from "../utils/ApiError";

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

/*
 * Generic rate limiter middleware.
 * Key: {prefix}:{ip} — one counter per IP per prefix.
 * Fail-closed — Redis down rejects the request with 503.
 * This matches the fail-closed strategy used throughout
 * the auth service for all security-sensitive operations.
 *
 * For login specifically, the service layer adds a second
 * IP+email combined check — this route-level check is the
 * first line of defence against volumetric attacks.
 *
 * O(1) per request — atomic Lua INCR + EXPIRE.
 */
export const rateLimiter = (
  prefix: string,
  limit: number,
  windowSeconds: number
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
        // Dev-only bypass: set DEV_SKIP_RATE_LIMIT=true to skip rate limiting locally
        if (process.env.DEV_SKIP_RATE_LIMIT === 'true') {
          return next();
        }

      if (!redisClient.isReady) {
        logger.error(
          { prefix },
          "Redis unavailable — REJECTING request in rate limiter (fail-closed)"
        );
        throw new ApiError(503, "Service temporarily unavailable");
      }

      const key = `${prefix}:${req.ip}`;
      const attempts = await redisClient.eval(RATE_LIMIT_SCRIPT, {
        keys: [key],
        arguments: [String(windowSeconds)],
      }) as number;

      if (attempts > limit) {
        throw new ApiError(
          429,
          `Too many requests. Try again in ${windowSeconds} seconds.`
        );
      }

      next();

    } catch (error) {

      if (error instanceof ApiError) {
        return next(error);
      }

      logger.error({ err: error, prefix }, "Rate limiter unexpected error");
      next(new ApiError(503, "Service temporarily unavailable"));

    }
  };
};
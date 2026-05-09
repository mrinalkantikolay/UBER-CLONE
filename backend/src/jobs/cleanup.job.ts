import cron from "node-cron";
import { redisClient } from "../config/redis";
import logger from "../config/logger";

/*
 * Helper: iterate keys matching a pattern using SCAN
 * instead of KEYS to avoid blocking Redis.
 * O(n) amortised, but non-blocking per iteration.
 */
const scanKeys = async (pattern: string): Promise<string[]> => {
  const keys: string[] = [];
  let cursor: string = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });
    cursor = String(result.cursor);
    keys.push(...result.keys);
  } while (cursor !== "0");

  return keys;
};

export const startCleanupJobs = () => {
  // runs hourly
  cron.schedule("0 * * * *", async () => {
    try {
      if (!redisClient.isReady) return;

      // Trim sessions zsets by removing tokenIds whose refresh key no longer exists
      const keys = await scanKeys("user_sessions:*");

      for (const key of keys) {
        const tokenIds = await redisClient.zRange(key, 0, -1);
        const toRemove: string[] = [];
        const userId = key.split(":")[1];

        for (const tid of tokenIds) {
          const exists = await redisClient.exists(`refresh:${userId}:${tid}`);
          if (!exists) toRemove.push(tid);
        }

        if (toRemove.length > 0) {
          for (const tid of toRemove) {
            await redisClient.zRem(key, tid);
          }
        }
      }

      logger.debug("Cleanup job completed");
    } catch (err) {
      logger.error({ err }, "Cleanup job error");
    }
  });
};

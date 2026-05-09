import { createClient } from "redis";
import env from "./env";
import logger from "./logger";

export const redisClient = createClient({
  url: env.REDIS_URL,

  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error("Redis reconnect limit reached — giving up");
        return new Error("Redis reconnect failed");
      }

      return Math.min(retries * 100, 5000);
    },

    connectTimeout: 10000
  }
});

/* =========================
   Redis Event Listeners
========================= */

redisClient.on("connect", () => {
  logger.info("Redis connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis connected and ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

redisClient.on("error", (err: Error) => {
  logger.error({ err }, "Redis error");
});

/* =========================
   Connect Redis
========================= */

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.error({ err: error }, "Redis connection failed");
  }
};

/* =========================
   Shutdown Redis
========================= */

export const shutdownRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info("Redis connection closed");
    }
  } catch (error) {
    logger.error({ err: error }, "Redis shutdown error");
  }
};
import IORedis from "ioredis";
import env from "./env";
import logger from "./logger";

/* ======================================================
   IORedis Connection (for BullMQ)
   
   BullMQ requires ioredis, not node-redis v4.
   This connection is used ONLY by BullMQ queues/workers.
   The existing node-redis client in redis.ts remains
   untouched for all other operations (cache, GEO, rate limit).
====================================================== */

const parseRedisUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "127.0.0.1",
    port: parseInt(parsed.port, 10) || 6379,
    password: parsed.password || undefined,
  };
};

const redisOpts = parseRedisUrl(env.REDIS_URL);

export const ioRedisConnection = new IORedis({
  host: redisOpts.host,
  port: redisOpts.port,
  password: redisOpts.password,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
});

ioRedisConnection.on("connect", () => {
  logger.info("IORedis (BullMQ) connecting...");
});

ioRedisConnection.on("ready", () => {
  logger.info("IORedis (BullMQ) connected and ready");
});

ioRedisConnection.on("error", (err: Error) => {
  logger.error({ err }, "IORedis (BullMQ) error");
});

export const shutdownIORedis = async (): Promise<void> => {
  try {
    await ioRedisConnection.quit();
    logger.info("IORedis (BullMQ) connection closed");
  } catch (error) {
    logger.error({ err: error }, "IORedis (BullMQ) shutdown error");
  }
};

import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import hpp from "hpp";
import cookieParser from "cookie-parser";

import env from "./config/env";
import logger from "./config/logger";
import prisma from "./config/prisma";
import ApiError from "./utils/ApiError";
import { requestIdMiddleware, RequestWithId } from "./middlewares/requestId.middleware";
import { redisClient } from "./config/redis";
import { getLogContext } from "./config/logContext";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.config";

const app = express();

/* ---------------- Trust Proxy ---------------- */

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* ---------------- Request ID ---------------- */

app.use(requestIdMiddleware);

/* ---------------- Security Headers ---------------- */

app.use(helmet());

/* ---------------- CORS ---------------- */

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? env.CORS_ORIGIN : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-trace-id", "x-dev-admin"],
    exposedHeaders: ["X-Request-Id", "X-Trace-Id"],
  })
);

/* ---------------- Global Rate Limiter ---------------- */

/*
 * Broad DDoS guard — 100 req per 15 min per IP.
 * Uses Redis store for accuracy across multiple instances.
 * Falls back to memory store if Redis is unavailable at startup.
 * Precision rate limiting per route is handled by the
 * Redis-backed rateLimiter middleware in each route.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Try again later.",
  },
  ...(redisClient.isReady && {
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
  }),
});

app.use(limiter);

/* ---------------- Body Parser ---------------- */

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

/* ---------------- Cookie Parser ---------------- */

app.use(cookieParser(env.COOKIE_SECRET));

/* ---------------- HTTP Parameter Pollution ---------------- */

app.use(hpp());

/* ---------------- Request Logging ---------------- */

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug({ method: req.method, url: req.url }, "incoming request");
  next();
});

/* ---------------- Health Check ---------------- */

/*
 * Production-grade health check.
 * Pings PostgreSQL and Redis to verify all dependencies are alive.
 * K8s liveness/readiness probes should target this endpoint.
 */
app.get("/health", async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.postgres = "ok";
  } catch {
    checks.postgres = "down";
  }

  try {
    if (redisClient.isReady) {
      await redisClient.ping();
      checks.redis = "ok";
    } else {
      checks.redis = "down";
    }
  } catch {
    checks.redis = "down";
  }

  const allHealthy = Object.values(checks).every((v) => v === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "OK" : "DEGRADED",
    service: env.SERVICE_NAME,
    uptime: process.uptime(),
    checks,
  });
});

/* ---------------- Routes ---------------- */

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import driverRoutes from "./routes/driver.routes";
import locationRoutes from "./routes/location.routes";
import rideRoutes from "./routes/ride.routes";
import paymentRoutes from "./routes/payment.routes";
import notificationRoutes from "./routes/notification.routes";
import analyticsRoutes from "./routes/analytics.routes";
import adminRoutes from "./routes/admin.routes";
import metrics from "./metrics";

/* ---------------- Swagger ---------------- */

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

/* ---------------- Metrics ---------------- */

/*
 * Prometheus /metrics endpoint.
 * Protected by METRICS_TOKEN env var in production.
 * Without the token, returns 403 — prevents attackers from
 * scraping login failure rates and OTP block patterns.
 */
app.get("/metrics", async (req, res) => {
  if (env.NODE_ENV === "production" && env.METRICS_TOKEN) {
    const token = req.headers["authorization"]?.replace("Bearer ", "");
    if (token !== env.METRICS_TOKEN) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  try {
    res.set("Content-Type", metrics.register.contentType);
    res.send(await metrics.register.metrics());
  } catch (err) {
    res.status(500).send("metrics error");
  }
});

/* ---------------- 404 Handler ---------------- */

app.use((req: RequestWithId, res: Response) => {
  const ctx = getLogContext();
  const traceId = (ctx?.traceId as string) ?? "unknown";

  res.status(404).json({
    success: false,
    message: "Route not found",
    traceId,
  });
});

/* ---------------- Global Error Handler ---------------- */

app.use(
  (err: Error | ApiError, req: RequestWithId, res: Response, _next: NextFunction) => {

    const ctx = getLogContext();
    const traceId = (ctx?.traceId as string) ?? req.traceId ?? "unknown";

    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        traceId,
        errors: err.errors?.length ? err.errors : undefined,
      });
    }

    if (
      err.name === "JsonWebTokenError" ||
      err.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        traceId,
      });
    }

    logger.error({ err, traceId }, "Unhandled error");

    res.status(500).json({
      success: false,
      message:
        env.NODE_ENV === "production" ? "Internal server error" : err.message,
      traceId,
    });
  }
);

export default app;
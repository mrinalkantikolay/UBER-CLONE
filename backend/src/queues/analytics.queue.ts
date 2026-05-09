import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";
import {
  calculateSurge,
  sweepAggregationsToDB,
  runAnomalyDetection,
} from "../services/analytics.service";

/* ======================================================
   ANALYTICS REPEATABLE QUEUES
   
   MVP BullMQ Jobs:
   - analytics-surge-calculator   (every 60s)
   - analytics-aggregation-sweep  (every 5 min / hourly in prod)
   - analytics-anomaly-detection  (every 5 min — scans metrics)
====================================================== */

export const analyticsQueue = new Queue("analytics-jobs", {
  connection: ioRedisConnection,
});

/* ---- Worker ---- */

export const analyticsWorker = new Worker(
  "analytics-jobs",
  async (job: Job) => {
    logger.info({ jobName: job.name }, "Running recurring analytics job");

    if (job.name === "surge-calculator") {
      // Run surge calculation for "global" city
      // Production: loop over an active cities registry
      const surgeMultiplier = await calculateSurge("global");

      if (surgeMultiplier >= 3.0) {
        logger.warn(
          { city: "global", surge: surgeMultiplier.toFixed(2) },
          "ANOMALY DETECTED: High surge during surge-calculator run"
        );
      }
    }

    else if (job.name === "aggregation-sweep") {
      await sweepAggregationsToDB("global");
    }

    else if (job.name === "anomaly-detection") {
      const result = await runAnomalyDetection("global");

      if (result.alerts.length > 0) {
        logger.warn(
          { city: "global", alertCount: result.alerts.length, alerts: result.alerts },
          "Anomaly detection completed — alerts generated"
        );
      } else {
        logger.debug({ city: "global" }, "Anomaly detection completed — no alerts");
      }
    }
  },
  {
    connection: ioRedisConnection,
    concurrency: 1,
  }
);

/* ---- Setup repeatable jobs ---- */
export const registerAnalyticsJobs = async () => {
  // Surge calculation every 60s (MVP: "Recalculate every 60 seconds")
  await analyticsQueue.add("surge-calculator", {}, {
    repeat: {
      pattern: "* * * * *", // every minute
    },
  });

  // Aggregation sweep every 5 minutes (hourly in production)
  await analyticsQueue.add("aggregation-sweep", {}, {
    repeat: {
      pattern: "*/5 * * * *",
    },
  });

  // Anomaly detection every 5 minutes (MVP: "scans metrics, generates alerts")
  await analyticsQueue.add("anomaly-detection", {}, {
    repeat: {
      pattern: "*/5 * * * *",
    },
  });

  logger.info("Analytics repeatable jobs registered (surge, aggregation, anomaly-detection)");
};

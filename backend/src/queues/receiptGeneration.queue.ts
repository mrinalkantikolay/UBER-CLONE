import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";

/* ======================================================
   RECEIPT GENERATION QUEUE
   
   Async receipt generation (PDF + Email) via BullMQ.
   5 retries with exponential backoff.
   
   TODO: Integrate with PDF generator (puppeteer/pdfkit)
   and email provider (SendGrid/SES) in production.
====================================================== */

type ReceiptJobData = {
  paymentId: string;
  rideId: string;
  userId: string;
  amount: number;
  traceId: string;
};

/* ---- Queue ---- */

export const receiptGenerationQueue = new Queue<ReceiptJobData>(
  "receipt-generation",
  {
    connection: ioRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  }
);

/* ---- Worker ---- */

export const receiptGenerationWorker = new Worker<ReceiptJobData>(
  "receipt-generation",
  async (job: Job<ReceiptJobData>) => {
    const { paymentId, rideId, userId, amount, traceId } = job.data;

    logger.info(
      { jobId: job.id, paymentId, rideId, userId, amount, attempt: job.attemptsMade + 1, traceId },
      `Generating receipt for ride ${rideId}`
    );

    /*
     * TODO: Production implementation:
     * 1. Fetch ride details from DB
     * 2. Generate PDF receipt (pdfkit / puppeteer)
     * 3. Upload to S3/GCS
     * 4. Send receipt email via SendGrid/SES
     *
     * For now, log as delivered (stub).
     */

    logger.info(
      { jobId: job.id, paymentId, rideId, traceId },
      "Receipt generated and sent (stub)"
    );
  },
  {
    connection: ioRedisConnection,
    concurrency: 3,
  }
);

/* ---- Event Listeners ---- */

receiptGenerationWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id, rideId: job.data.rideId }, "Receipt job completed");
});

receiptGenerationWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, rideId: job?.data.rideId, err, attempts: job?.attemptsMade },
    "Receipt job failed"
  );
});

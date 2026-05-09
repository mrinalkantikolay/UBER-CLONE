import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";

import driverDocumentModel from "../models/driverDocument.model";

/* ======================================================
   OCR VERIFICATION QUEUE
   Handles async document verification.
   In production, replace the mock with Google Cloud Vision
   or AWS Textract API call.
   3 retries with exponential backoff (3s, 6s, 12s).
====================================================== */

type OCRJobData = {
  documentId: string;
  documentUrl: string;
  driverId: string;
  traceId: string;
};

/* ---- Queue ---- */

export const ocrQueue = new Queue<OCRJobData>(
  "ocr-verification-queue",
  {
    connection: ioRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 3000, // 3s → 6s → 12s
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  }
);

/* ---- Worker ---- */

export const ocrWorker = new Worker<OCRJobData>(
  "ocr-verification-queue",
  async (job: Job<OCRJobData>) => {
    const { documentId, documentUrl, driverId, traceId } = job.data;

    logger.info(
      { jobId: job.id, documentId, documentUrl, traceId, attempt: job.attemptsMade + 1 },
      "Processing OCR verification job"
    );

    /*
     * TODO: Replace this mock with actual OCR API call:
     *
     * const result = await googleCloudVision.textDetection(documentUrl);
     * const isValid = validateDocumentText(result.text);
     *
     * For now, simulate a 3-second heavy AI scan.
     */
    await new Promise((resolve) => setTimeout(resolve, 3000));

    /* Mock result: auto-approve */
    const verified = true;

    await driverDocumentModel.verifyDocument(documentId, verified);

    logger.info(
      { jobId: job.id, documentId, driverId, verified, traceId },
      `Document OCR verification complete — ${verified ? "APPROVED" : "REJECTED"}`
    );
  },
  {
    connection: ioRedisConnection,
    concurrency: 2, // OCR is heavy — limit concurrency
  }
);

/* ---- Event Listeners ---- */

ocrWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "OCR verification job completed");
});

ocrWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, err, attempts: job?.attemptsMade },
    "OCR verification job failed"
  );
});

import { Queue, Worker, Job } from "bullmq";
import { ioRedisConnection } from "../config/bullmq";
import logger from "../config/logger";
import { processRefund } from "../utils/paymentGateway";
import paymentModel from "../models/payment.model";

/* ======================================================
   PAYMENT REFUND QUEUE
   
   Async refund processing via BullMQ.
   5 retries with exponential backoff per MVP mandate.
   
   Worker calls the payment gateway stub to process refunds,
   then updates the Payment DB record.
====================================================== */

type RefundJobData = {
  paymentId: string;
  rideId: string;
  gatewayTransactionId: string;
  amount: number;
  traceId: string;
};

/* ---- Queue ---- */

export const paymentRefundQueue = new Queue<RefundJobData>(
  "payment-refund",
  {
    connection: ioRedisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000, // 2s → 4s → 8s → 16s → 32s
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  }
);

/* ---- Worker ---- */

export const paymentRefundWorker = new Worker<RefundJobData>(
  "payment-refund",
  async (job: Job<RefundJobData>) => {
    const { paymentId, rideId, gatewayTransactionId, amount, traceId } = job.data;

    logger.info(
      { jobId: job.id, paymentId, rideId, amount, attempt: job.attemptsMade + 1, traceId },
      `Processing refund for ride ${rideId}`
    );

    /* Call payment gateway (stub) */
    const result = await processRefund(gatewayTransactionId, amount);

    /* Update DB: REFUND_PROCESSING → REFUNDED */
    const updated = await paymentModel.updateStatus(
      paymentId,
      "REFUND_PROCESSING",
      "REFUNDED"
    );

    if (!updated) {
      logger.warn({ paymentId, traceId }, "Refund DB update failed — payment not in REFUND_PROCESSING state");
    }

    logger.info(
      { jobId: job.id, paymentId, refundId: result.refundId, traceId },
      "Refund processed successfully"
    );
  },
  {
    connection: ioRedisConnection,
    concurrency: 3,
  }
);

/* ---- Event Listeners ---- */

paymentRefundWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id, paymentId: job.data.paymentId }, "Refund job completed");
});

paymentRefundWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, paymentId: job?.data.paymentId, err, attempts: job?.attemptsMade },
    "Refund job failed"
  );
});

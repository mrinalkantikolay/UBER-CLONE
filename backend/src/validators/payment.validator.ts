import { z } from "zod";

/* ======================================================
   PAYMENT VALIDATORS — Zod schemas
====================================================== */

/* ---- URL Param: paymentId ---- */

export const paymentIdParamSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
});

/* ---- Webhook body ---- */

export const webhookSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  signature: z.string().min(1, "signature is required"),
  rideId: z.string().uuid("Invalid ride ID"),
  gatewayTransactionId: z.string().min(1, "gatewayTransactionId is required"),
  status: z.enum(["success", "failed"], {
    message: "status must be 'success' or 'failed'",
  }),
});

/* ---- Payment history query params ---- */

export const paymentHistoryQuerySchema = z.object({
  cursor: z.string().uuid("Invalid cursor").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10),
});

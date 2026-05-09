import { z } from "zod";

/* ======================================================
   NOTIFICATION VALIDATORS
====================================================== */

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID"),
});

export const notificationHistoryQuerySchema = z.object({
  cursor: z.string().uuid("Invalid cursor").optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
});

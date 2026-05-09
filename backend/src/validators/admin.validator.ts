import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const blockUserSchema = z.object({
  id: z.string().uuid(),
});

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
});

export const toggleFeatureSchema = z.object({
  flagName: z.string().min(1),
  enabled: z.boolean(),
});

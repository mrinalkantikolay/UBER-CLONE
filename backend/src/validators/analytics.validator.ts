import { z } from "zod";

export const analyticsQuerySchema = z.object({
  city: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).refine((data) => {
  if (data.from && data.to) {
    return new Date(data.from) <= new Date(data.to);
  }
  return true;
}, {
  message: "'from' date must be before 'to' date",
  path: ["from"],
});

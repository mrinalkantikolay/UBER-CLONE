import { z } from "zod";

/* ================================
   BASE FIELDS
================================ */

const name = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be at most 60 characters")
  .regex(
    /^[\p{L}\s'\-\.]+$/u,
    "Name can only contain letters, spaces, hyphens, apostrophes, and dots"
  );

const phone = z
  .string()
  .min(10, "Phone must be at least 10 digits")
  .max(15, "Phone must be at most 15 digits")
  .regex(/^\+?[0-9]+$/, "Phone must contain only digits and optional leading +");

/*
 * Password — same rules as auth.validator.ts.
 * Max 72 to match bcrypt's input limit.
 */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .superRefine((val, ctx) => {
    let score = 0;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Password must contain at least 3 of: uppercase, lowercase, digit, special character",
      });
    }
  });

/* ================================
   SCHEMAS
================================ */

export const updateProfileSchema = z.object({
  name: name.optional(),
  phone: phone.optional(),
  profilePhotoUrl: z.string().url("Invalid URL").optional(),
}).refine(
  (data) => data.name || data.phone || data.profilePhotoUrl,
  { message: "At least one field must be provided" }
);

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
}).refine(
  (data) => data.oldPassword !== data.newPassword,
  { message: "New password must be different from current password" }
);

export const uploadProfilePictureSchema = z.object({
  profilePhotoUrl: z.string().url("Invalid profile photo URL"),
});

export const addPaymentMethodSchema = z.object({
  provider: z.enum(["STRIPE", "RAZORPAY", "UPI"] as const, {
    error: "Provider must be STRIPE, RAZORPAY, or UPI",
  }),
  last4: z
    .string()
    .length(4, "last4 must be exactly 4 characters")
    .regex(/^[0-9A-Za-z]+$/, "last4 must be alphanumeric"),
  label: z.string().min(1).max(50).trim().optional(),
  isDefault: z.boolean().optional(),
});

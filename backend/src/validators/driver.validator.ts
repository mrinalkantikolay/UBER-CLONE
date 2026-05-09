import { z } from "zod";

/* ================================
   BASE FIELDS
================================ */

const vehicleNumber = z
  .string()
  .min(4, "Vehicle number must be at least 4 characters")
  .max(20, "Vehicle number must be at most 20 characters")
  .toUpperCase()
  .trim();

const licenseNumber = z
  .string()
  .min(5, "License number must be at least 5 characters")
  .max(30, "License number must be at most 30 characters")
  .toUpperCase()
  .trim();

const vehicleType = z.enum(["SEDAN", "SUV", "HATCHBACK", "AUTO", "BIKE"] as const, {
  error: "Vehicle type must be SEDAN, SUV, HATCHBACK, AUTO, or BIKE",
});

const documentType = z.enum(["LICENSE", "REGISTRATION", "INSURANCE", "AADHAR", "PAN"] as const, {
  error: "Document type must be LICENSE, REGISTRATION, INSURANCE, AADHAR, or PAN",
});

const driverStatus = z.enum(["AVAILABLE", "BUSY", "OFFLINE"] as const, {
  error: "Status must be AVAILABLE, BUSY, or OFFLINE",
});

/* ================================
   SCHEMAS
================================ */

export const registerDriverSchema = z.object({
  vehicleNumber,
  licenseNumber,
});

export const updateStatusSchema = z.object({
  status: driverStatus,
});

export const addVehicleSchema = z.object({
  type: vehicleType,
  make: z.string().min(1, "Make is required").max(50).trim(),
  model: z.string().min(1, "Model is required").max(50).trim(),
  year: z.number().int().min(1990, "Year must be 1990 or later").max(new Date().getFullYear() + 1, "Invalid year"),
  licensePlate: z.string().min(2, "License plate is required").max(20).toUpperCase().trim(),
  color: z.string().min(1, "Color is required").max(30).trim(),
});

export const updateVehicleSchema = z.object({
  type: vehicleType.optional(),
  make: z.string().min(1).max(50).trim().optional(),
  model: z.string().min(1).max(50).trim().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().min(2).max(20).toUpperCase().trim().optional(),
  color: z.string().min(1).max(30).trim().optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

export const addDocumentSchema = z.object({
  type: documentType,
  documentUrl: z.string().url("Invalid document URL"),
  expiresAt: z.string().datetime("Invalid date format").optional(),
});

export const verifyDocumentSchema = z.object({
  verified: z.boolean({ error: "verified must be a boolean" }),
});

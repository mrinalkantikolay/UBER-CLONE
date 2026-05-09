import crypto from "crypto";

import logger from "../config/logger";
import ApiError from "../utils/ApiError";
import auditLogger from "../utils/auditLogger";
import { deleteFromCloudinary } from "../utils/cloudinaryUtils";

import driverModel from "../models/driver.model";
import vehicleModel from "../models/vehicle.model";
import driverDocumentModel from "../models/driverDocument.model";
import userModel from "../models/user.model";
import { ocrQueue } from "../queues/ocr.queue";

import { DriverStatus, VehicleType, DocumentType } from "@prisma/client";

/* ======================================================
   TYPES
====================================================== */

type RegisterDriverInput = {
  vehicleNumber: string;
  licenseNumber: string;
};

type AddVehicleInput = {
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
};

type UpdateVehicleInput = Partial<AddVehicleInput>;

type AddDocumentInput = {
  type: DocumentType;
  documentUrl: string;
  expiresAt?: string;
};

/* ======================================================
   HELPERS
====================================================== */

const ensureTraceId = (traceId?: string): string =>
  traceId ?? crypto.randomUUID();

const safeAudit = (
  event: string,
  payload: Record<string, unknown>,
  traceId: string
): void => {
  try {
    auditLogger(event, { ...payload, traceId });
  } catch (err) {
    logger.error({ err, event, traceId }, "AUDIT LOG FAILED");
  }
};

/* ======================================================
   REGISTER AS DRIVER
====================================================== */

export const registerDriver = async (
  userId: string,
  data: RegisterDriverInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  /* Check user exists and is active */
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.isActive) throw new ApiError(403, "Account is deactivated");

  /* Check if already registered as driver */
  const existing = await driverModel.findByUserId(userId);
  if (existing) throw new ApiError(409, "User is already registered as a driver");

  /* Check license number is unique */
  const licenseExists = await driverModel.findByLicenseNumber(data.licenseNumber);
  if (licenseExists) throw new ApiError(409, "License number already registered");

  const driver = await driverModel.createDriver({
    vehicleNumber: data.vehicleNumber,
    licenseNumber: data.licenseNumber,
    user: { connect: { id: userId } },
  });

  safeAudit("driver:register", { userId, driverId: driver.id }, tid);

  logger.info({ userId, driverId: driver.id, traceId: tid }, "Driver registered");

  return driver;
};

/* ======================================================
   GET DRIVER PROFILE
====================================================== */

export const getDriverProfile = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserIdWithRelations(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  logger.debug({ userId, driverId: driver.id, traceId: tid }, "Driver profile fetched");

  return driver;
};

/* ======================================================
   UPDATE STATUS
====================================================== */

export const updateStatus = async (
  userId: string,
  status: DriverStatus,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const updated = await driverModel.updateStatus(driver.id, status);

  safeAudit("driver:status", { userId, driverId: driver.id, status }, tid);

  logger.info(
    { userId, driverId: driver.id, oldStatus: driver.status, newStatus: status, traceId: tid },
    "Driver status updated"
  );

  return updated;
};

/* ======================================================
   VEHICLE MANAGEMENT
====================================================== */

export const addVehicle = async (
  userId: string,
  data: AddVehicleInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  /* Check if driver already has a vehicle (1:1 relation) */
  const existing = await vehicleModel.findByDriverId(driver.id);
  if (existing) throw new ApiError(409, "Driver already has a vehicle. Update it instead.");

  /* Check license plate is unique */
  const plateExists = await vehicleModel.findByLicensePlate(data.licensePlate);
  if (plateExists) throw new ApiError(409, "License plate already registered");

  const vehicle = await vehicleModel.createVehicle({
    type: data.type,
    make: data.make,
    model: data.model,
    year: data.year,
    licensePlate: data.licensePlate,
    color: data.color,
    driver: { connect: { id: driver.id } },
  });

  safeAudit("driver:vehicle:add", { userId, driverId: driver.id, vehicleId: vehicle.id }, tid);

  logger.info({ userId, vehicleId: vehicle.id, traceId: tid }, "Vehicle added");

  return vehicle;
};

export const updateVehicle = async (
  userId: string,
  data: UpdateVehicleInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const existing = await vehicleModel.findByDriverId(driver.id);
  if (!existing) throw new ApiError(404, "No vehicle found. Add one first.");

  /* If changing license plate, check uniqueness */
  if (data.licensePlate && data.licensePlate !== existing.licensePlate) {
    const plateExists = await vehicleModel.findByLicensePlate(data.licensePlate);
    if (plateExists) throw new ApiError(409, "License plate already registered");
  }

  const vehicle = await vehicleModel.updateVehicle(driver.id, data);

  safeAudit("driver:vehicle:update", { userId, vehicleId: vehicle.id, fields: Object.keys(data) }, tid);

  logger.info({ userId, vehicleId: vehicle.id, traceId: tid }, "Vehicle updated");

  return vehicle;
};

/* ======================================================
   DOCUMENT MANAGEMENT
====================================================== */

export const addDocument = async (
  userId: string,
  data: AddDocumentInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const document = await driverDocumentModel.createDocument({
    type: data.type,
    documentUrl: data.documentUrl,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    driver: { connect: { id: driver.id } },
  });

  safeAudit("driver:document:add", { userId, driverId: driver.id, documentId: document.id, type: data.type }, tid);

  logger.info({ userId, documentId: document.id, type: data.type, traceId: tid }, "Document uploaded");

  try {
    await ocrQueue.add("verify-document-ocr", {
      documentId: document.id,
      documentUrl: document.documentUrl,
      driverId: driver.id,
      traceId: tid,
    });
    logger.info({ traceId: tid, documentId: document.id }, "Document queued for async OCR verification");
  } catch (err) {
    logger.error({ err, traceId: tid, documentId: document.id }, "Failed to queue OCR verification job");
  }

  return document;
};

export const getDocuments = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const documents = await driverDocumentModel.findByDriverId(driver.id);

  logger.debug({ userId, count: documents.length, traceId: tid }, "Documents fetched");

  return documents;
};

export const deleteDocument = async (
  userId: string,
  documentId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  const document = await driverDocumentModel.findById(documentId);
  if (!document) throw new ApiError(404, "Document not found");

  /* Ensure the document belongs to THIS driver */
  if (document.driverId !== driver.id) {
    throw new ApiError(403, "You can only delete your own documents");
  }

  /* ---- Delete file from Cloudinary ---- */
  if (document.documentUrl) {
    /* PDFs are stored as 'raw' resource type in Cloudinary */
    const resourceType = document.documentUrl.includes("/raw/") ? "raw" : "image";
    await deleteFromCloudinary(document.documentUrl, resourceType);
  }

  await driverDocumentModel.deleteDocument(documentId);

  safeAudit("driver:document:delete", { userId, documentId, type: document.type }, tid);

  logger.info({ userId, documentId, traceId: tid }, "Document deleted");

  return { message: "Document deleted successfully" };
};

/* ======================================================
   VERIFY DOCUMENT
====================================================== */

export const verifyDocument = async (
  documentId: string,
  verified: boolean,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const document = await driverDocumentModel.findById(documentId);
  if (!document) throw new ApiError(404, "Document not found");

  const updated = await driverDocumentModel.verifyDocument(documentId, verified);

  safeAudit(
    "driver:document:verify",
    { documentId, driverId: document.driverId, verified },
    tid
  );

  logger.info(
    { documentId, verified, traceId: tid },
    `Document ${verified ? "approved" : "rejected"}`
  );

  return updated;
};

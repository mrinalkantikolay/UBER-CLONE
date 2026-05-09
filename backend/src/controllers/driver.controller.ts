import { Request, Response } from "express";
import * as driverService from "../services/driver.service";

import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import { DriverDTO, VehicleDTO, DocumentDTO, DriverProfileDTO } from "../dto/driver.dto";

import { AuthRequest } from "../middlewares/auth.middleware";
import crypto from "crypto";

/* ======================================================
   TRACE ID
====================================================== */

const getTraceId = (req: Request): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   REGISTER AS DRIVER
====================================================== */

export const registerDriver = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const driver = await driverService.registerDriver(userId, req.body, traceId);

    return apiResponse(res, 201, "Driver registered successfully", {
      driver: DriverDTO.toDTO(driver),
    });
  }
);

/* ======================================================
   GET DRIVER PROFILE
====================================================== */

export const getDriverProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const profile = await driverService.getDriverProfile(userId, traceId);

    return apiResponse(res, 200, "Driver profile retrieved", {
      profile: DriverProfileDTO.toDTO(profile),
    });
  }
);

/* ======================================================
   UPDATE STATUS
====================================================== */

export const updateStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const { status } = req.body;

    const driver = await driverService.updateStatus(userId, status, traceId);

    return apiResponse(res, 200, "Status updated", {
      driver: DriverDTO.toDTO(driver),
    });
  }
);

/* ======================================================
   ADD VEHICLE
====================================================== */

export const addVehicle = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const vehicle = await driverService.addVehicle(userId, req.body, traceId);

    return apiResponse(res, 201, "Vehicle added", {
      vehicle: VehicleDTO.toDTO(vehicle),
    });
  }
);

/* ======================================================
   UPDATE VEHICLE
====================================================== */

export const updateVehicle = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const vehicle = await driverService.updateVehicle(userId, req.body, traceId);

    return apiResponse(res, 200, "Vehicle updated", {
      vehicle: VehicleDTO.toDTO(vehicle),
    });
  }
);

/* ======================================================
   ADD DOCUMENT (Multer + Cloudinary)
====================================================== */

export const addDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    /* Multer puts the uploaded file info on req.file */
    if (!req.file) {
      return apiResponse(res, 400, "No document file provided. Use 'document' field in multipart/form-data.");
    }

    /* Text fields come from req.body in multipart/form-data */
    const { type, expiresAt } = req.body;

    if (!type) {
      return apiResponse(res, 400, "Document type is required (LICENSE, REGISTRATION, INSURANCE, AADHAR, PAN).");
    }

    const validTypes = ["LICENSE", "REGISTRATION", "INSURANCE", "AADHAR", "PAN"];
    if (!validTypes.includes(type)) {
      return apiResponse(res, 400, `Invalid document type. Must be one of: ${validTypes.join(", ")}`);
    }

    /* Cloudinary storage engine sets `path` to the uploaded URL */
    const documentUrl = req.file.path;

    const document = await driverService.addDocument(
      userId,
      { type, documentUrl, expiresAt },
      traceId
    );

    return apiResponse(res, 201, "Document uploaded", {
      document: DocumentDTO.toDTO(document),
    });
  }
);

/* ======================================================
   GET DOCUMENTS
====================================================== */

export const getDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const documents = await driverService.getDocuments(userId, traceId);

    return apiResponse(res, 200, "Documents retrieved", {
      documents: DocumentDTO.toDTOArray(documents),
    });
  }
);

/* ======================================================
   DELETE DOCUMENT
====================================================== */

export const deleteDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const id = req.params.id as string;

    if (!id) {
      return apiResponse(res, 400, "Document ID is required");
    }

    const result = await driverService.deleteDocument(userId, id, traceId);

    return apiResponse(res, 200, result.message);
  }
);

/* ======================================================
   VERIFY DOCUMENT
====================================================== */

export const verifyDocument = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const id = req.params.id as string;

    if (!id) {
      return apiResponse(res, 400, "Document ID is required");
    }

    const { verified } = req.body;

    const document = await driverService.verifyDocument(id, verified, traceId);

    return apiResponse(res, 200, `Document ${verified ? "approved" : "rejected"}`, {
      document: DocumentDTO.toDTO(document),
    });
  }
);

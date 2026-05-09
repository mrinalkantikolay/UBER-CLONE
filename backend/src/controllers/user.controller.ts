import { Request, Response } from "express";
import * as userService from "../services/user.service";

import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import UserDTO from "../dto/user.dto";
import logger from "../config/logger";

import { AuthRequest } from "../middlewares/auth.middleware";
import crypto from "crypto";

import {
  COOKIE_NAME,
  CLEAR_COOKIE_OPTIONS
} from "../config/cookies";

/* ======================================================
   TRACE ID
====================================================== */

const getTraceId = (req: Request): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   GET PROFILE
====================================================== */

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const user = await userService.getProfile(userId, traceId);

    return apiResponse(res, 200, "Profile retrieved", {
      user: UserDTO.toDTO(user),
    });
  }
);

/* ======================================================
   UPDATE PROFILE
====================================================== */

export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const user = await userService.updateProfile(userId, req.body, traceId);

    return apiResponse(res, 200, "Profile updated", {
      user: UserDTO.toDTO(user),
    });
  }
);

/* ======================================================
   CHANGE PASSWORD
====================================================== */

export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const { oldPassword, newPassword } = req.body;

    const result = await userService.changePassword(userId, oldPassword, newPassword, traceId);

    res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);

    return apiResponse(res, 200, result.message);
  }
);

/* ======================================================
   DEACTIVATE ACCOUNT
====================================================== */

export const deactivateAccount = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const result = await userService.deactivateAccount(userId, traceId);

    res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);

    return apiResponse(res, 200, result.message);
  }
);

/* ======================================================
   UPLOAD PROFILE PICTURE (Multer + Cloudinary)
====================================================== */

export const uploadProfilePicture = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    /* Multer puts the uploaded file info on req.file */
    if (!req.file) {
      return apiResponse(res, 400, "No photo file provided. Use 'photo' field in multipart/form-data.");
    }

    /* Cloudinary storage engine sets `path` to the uploaded URL */
    const profilePhotoUrl = req.file.path;

    const user = await userService.uploadProfilePicture(userId, profilePhotoUrl, traceId);

    return apiResponse(res, 200, "Profile picture updated", {
      user: UserDTO.toDTO(user),
    });
  }
);

/* ======================================================
   ADD PAYMENT METHOD
====================================================== */

export const addPaymentMethod = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const method = await userService.addPaymentMethod(userId, req.body, traceId);

    return apiResponse(res, 201, "Payment method added", { paymentMethod: method });
  }
);

/* ======================================================
   GET PAYMENT METHODS
====================================================== */

export const getPaymentMethods = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const methods = await userService.getPaymentMethods(userId, traceId);

    return apiResponse(res, 200, "Payment methods retrieved", { paymentMethods: methods });
  }
);

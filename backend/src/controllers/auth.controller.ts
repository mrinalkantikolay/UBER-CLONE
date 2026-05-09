import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { hashDeviceId, DeviceInfo } from "../services/auth.service";

import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";

import UserDTO from "../dto/user.dto";
import logger from "../config/logger";

import {
  COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS
} from "../config/cookies";

import { AuthRequest } from "../middlewares/auth.middleware";
import crypto from "crypto";

/* ======================================================
   TRACE ID
   Reads x-trace-id header if provided by API gateway or
   upstream service. Falls back to a fresh UUID so every
   request is always traceable end-to-end.
====================================================== */

const getTraceId = (req: Request): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   DEVICE INFO HELPER
====================================================== */

const parseOS = (userAgent: string): string => {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "unknown";
};

const parseBrowser = (userAgent: string): string => {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) return "Opera";
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  return "unknown";
};

const getDeviceInfo = (req: Request): DeviceInfo => {
  const userAgent = req.headers["user-agent"] || "unknown";
  return {
    ip: req.ip ?? "unknown",
    browser: parseBrowser(userAgent),
    os: parseOS(userAgent),
  };
};

/* ======================================================
   AUDIT LOGGER HELPER
====================================================== */

const auditLog = (
  event: string,
  opts: {
    userId?: string;
    email?: string;
    ip?: string;
    deviceInfo?: DeviceInfo;
    traceId?: string;
  }
) => {
  logger.info(
    {
      event,
      userId: opts.userId,
      email: opts.email,
      ip: opts.ip,
      deviceId: opts.deviceInfo ? hashDeviceId(opts.deviceInfo) : undefined,
      traceId: opts.traceId,
      timestamp: new Date().toISOString(),
    },
    `AUDIT: ${event}`
  );
};

/* ======================================================
   SIGNUP
====================================================== */

export const signup = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const deviceInfo = getDeviceInfo(req);
    const { name, email, password } = req.body;

    const result = await authService.signup(
      { name, email, password },
      deviceInfo,
      traceId
    );

    res.cookie(COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    auditLog("SIGNUP", {
      userId: result.user.id,
      email,
      ip: req.ip,
      deviceInfo,
      traceId,
    });

    return apiResponse(res, 201, "Signup successful", {
      user: UserDTO.toDTO(result.user),
      accessToken: result.accessToken,
    });
  }
);

/* ======================================================
   LOGIN
====================================================== */

export const login = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const deviceInfo = getDeviceInfo(req);
    const { email, password } = req.body;

    const result = await authService.login(
      { email, password },
      req.ip ?? "unknown",
      deviceInfo,
      traceId
    );

    auditLog("LOGIN", {
      userId: result.user.id,
      email,
      ip: req.ip,
      deviceInfo,
      traceId,
    });

    if (result.requiresOTP) {
      return apiResponse(res, 200, "OTP required", {
        user: UserDTO.toDTO(result.user),
        requiresOTP: true,
        requestId: result.requestId,
      });
    }

    res.cookie(COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return apiResponse(res, 200, "Login successful", {
      user: UserDTO.toDTO(result.user),
      accessToken: result.accessToken,
    });
  }
);

/* ======================================================
   CONFIRM DEVICE
====================================================== */

export const confirmDevice = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const deviceInfo = getDeviceInfo(req);

    await authService.confirmDevice(userId, deviceInfo);

    auditLog("DEVICE_CONFIRMED", {
      userId,
      ip: req.ip,
      deviceInfo,
      traceId,
    });

    return apiResponse(res, 200, "Device confirmed");
  }
);

/* ======================================================
   REFRESH ACCESS TOKEN
====================================================== */

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const token = req.cookies?.refreshToken;

    if (!token) {
      return apiResponse(res, 401, "Refresh token missing");
    }

    const result = await authService.refreshAccessToken(token, traceId);

    res.cookie(COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return apiResponse(res, 200, "Token refreshed", {
      accessToken: result.accessToken,
    });
  }
);

/* ======================================================
   LOGOUT
====================================================== */

export const logout = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const deviceInfo = getDeviceInfo(req);
    const refreshTokenVal = req.cookies?.refreshToken;

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : "";

    await authService.logout(accessToken, refreshTokenVal ?? "", traceId);

    res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);

    auditLog("LOGOUT", {
      userId: req.user?.id,
      ip: req.ip,
      deviceInfo,
      traceId,
    });

    return apiResponse(res, 200, "Logged out successfully");
  }
);

/* ======================================================
   LOGOUT ALL DEVICES
====================================================== */

export const logoutAll = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    await authService.logoutAll(userId, undefined, traceId);

    res.clearCookie(COOKIE_NAME, CLEAR_COOKIE_OPTIONS);

    auditLog("LOGOUT_ALL", {
      userId,
      ip: req.ip,
      deviceInfo: getDeviceInfo(req),
      traceId,
    });

    return apiResponse(res, 200, "Logged out from all devices");
  }
);

/* ======================================================
   SEND OTP
   Phone is fetched from the user record inside the service
   via the login flow. This standalone endpoint (used for
   password reset OTP resend) passes null for phone —
   the service falls back to email delivery.
====================================================== */

export const sendOTP = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const { email, requestId } = req.body;

    await authService.sendOTP(email, requestId, null, traceId);

    return apiResponse(res, 200, "OTP sent successfully");
  }
);

/* ======================================================
   VERIFY OTP
====================================================== */

export const verifyOTP = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const { email, requestId, otp } = req.body;

    await authService.verifyOTP(email, requestId, otp, traceId);

    return apiResponse(res, 200, "OTP verified");
  }
);

/* ======================================================
   COMPLETE OTP LOGIN
====================================================== */

export const completeOTPLogin = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const { email, requestId, otp } = req.body;

    const result = await authService.completeOTPLogin(
      email,
      requestId,
      otp,
      traceId
    );

    res.cookie(COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    auditLog("OTP_LOGIN_COMPLETE", {
      userId: result.user.id,
      email,
      ip: req.ip,
      deviceInfo: getDeviceInfo(req),
      traceId,
    });

    return apiResponse(res, 200, "Login successful", {
      user: UserDTO.toDTO(result.user),
      accessToken: result.accessToken,
    });
  }
);

/* ======================================================
   RESET PASSWORD
====================================================== */

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {

    const traceId = getTraceId(req);
    const { email, requestId, otp, newPassword } = req.body;

    await authService.resetPassword(email, requestId, otp, newPassword, traceId);

    auditLog("PASSWORD_RESET", {
      email,
      ip: req.ip,
      deviceInfo: getDeviceInfo(req),
      traceId,
    });

    return apiResponse(res, 200, "Password reset successful");
  }
);
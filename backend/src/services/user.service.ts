import bcrypt from "bcrypt";
import crypto from "crypto";

import env from "../config/env";
import logger from "../config/logger";
import userModel from "../models/user.model";
import paymentMethodModel from "../models/paymentMethod.model";
import { redisClient } from "../config/redis";
import ApiError from "../utils/ApiError";
import auditLogger from "../utils/auditLogger";
import { deleteFromCloudinary } from "../utils/cloudinaryUtils";
import { logoutAll } from "./auth.service";

import { PaymentProvider } from "@prisma/client";

/* ======================================================
   TYPES
====================================================== */

type UpdateProfileInput = {
  name?: string;
  phone?: string;
  profilePhotoUrl?: string;
};

type AddPaymentMethodInput = {
  provider: PaymentProvider;
  last4: string;
  label?: string;
  isDefault?: boolean;
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

const PASSWORD_RULES = [
  /[A-Z]/,
  /[a-z]/,
  /[0-9]/,
  /[^A-Za-z0-9]/,
];

const assertPasswordStrength = (password: string): void => {
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed < 3) {
    throw new ApiError(
      400,
      "Password must contain at least 3 of: uppercase letter, lowercase letter, number, special character"
    );
  }
};

const invalidateUserCache = async (userId: string): Promise<void> => {
  try {
    if (redisClient.isReady) {
      await redisClient.del(`user_profile:${userId}`);
    }
  } catch (err) {
    logger.warn({ err, userId }, "Failed to invalidate user cache");
  }
};

/* ======================================================
   GET PROFILE
====================================================== */

export const getProfile = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated");
  }

  logger.debug({ userId, traceId: tid }, "Profile fetched");

  return user;
};

/* ======================================================
   UPDATE PROFILE
====================================================== */

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  /* If phone is changing, check for duplicates */
  if (data.phone && data.phone !== user.phone) {
    const existing = await userModel.findByPhone(data.phone);
    if (existing && existing.id !== userId) {
      throw new ApiError(409, "Phone number already in use");
    }
  }

  const updated = await userModel.updateProfile(userId, data);
  await invalidateUserCache(userId);

  safeAudit("profile:update", { userId, fields: Object.keys(data) }, tid);

  logger.info({ userId, fields: Object.keys(data), traceId: tid }, "Profile updated");

  return updated;
};

/* ======================================================
   UPLOAD PROFILE PICTURE
====================================================== */

export const uploadProfilePicture = async (
  userId: string,
  profilePhotoUrl: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  /* ---- Delete old photo from Cloudinary (if it exists) ---- */
  if (user.profilePhotoUrl) {
    await deleteFromCloudinary(user.profilePhotoUrl);
  }

  const updated = await userModel.updateProfile(userId, { profilePhotoUrl });
  await invalidateUserCache(userId);

  safeAudit("profile:photo", { userId }, tid);

  logger.info({ userId, traceId: tid }, "Profile picture updated (Cloudinary)");

  return updated;
};

/* ======================================================
   CHANGE PASSWORD
====================================================== */

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  /* Service-layer password strength enforcement */
  assertPasswordStrength(newPassword);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  /* Verify the current password */
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    throw new ApiError(401, "Current password is incorrect");
  }

  /* Hash new password and increment tokenVersion to invalidate all sessions */
  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(newPassword, salt);

  await userModel.updatePasswordAndIncrementVersion(userId, hashed);

  /* Revoke all sessions — forces re-login on all devices */
  await logoutAll(userId, user.email, tid);

  await invalidateUserCache(userId);

  safeAudit("password:change", { userId }, tid);

  logger.info({ userId, traceId: tid }, "Password changed — all sessions revoked");

  return { message: "Password changed successfully. Please login again." };
};

/* ======================================================
   DEACTIVATE ACCOUNT
====================================================== */

export const deactivateAccount = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  await userModel.deactivateAccount(userId);

  /* Revoke all sessions — deactivated user cannot hold tokens */
  await logoutAll(userId, user.email, tid);

  safeAudit("account:deactivate", { userId, email: user.email }, tid);

  logger.info({ userId, traceId: tid }, "Account deactivated — all sessions revoked");

  return { message: "Account deactivated successfully" };
};

/* ======================================================
   ADD PAYMENT METHOD
====================================================== */

export const addPaymentMethod = async (
  userId: string,
  data: AddPaymentMethodInput,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const paymentMethod = await paymentMethodModel.create({
    provider: data.provider,
    last4: data.last4,
    label: data.label ?? null,
    isDefault: data.isDefault ?? false,
    user: { connect: { id: userId } },
  });

  safeAudit("payment:add", { userId, paymentMethodId: paymentMethod.id, provider: data.provider }, tid);

  logger.info({ userId, paymentMethodId: paymentMethod.id, traceId: tid }, "Payment method added");

  return paymentMethod;
};

/* ======================================================
   GET PAYMENT METHODS
====================================================== */

export const getPaymentMethods = async (
  userId: string,
  traceId?: string
) => {
  const tid = ensureTraceId(traceId);

  const methods = await paymentMethodModel.findByUserId(userId);

  logger.debug({ userId, count: methods.length, traceId: tid }, "Payment methods fetched");

  return methods;
};


import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { redisClient } from "../config/redis";
import env from "../config/env";
import logger from "../config/logger";
import ApiError from "../utils/ApiError";
import { buildCloudEvent, insertOutboxEvent } from "../utils/outbox";

import adminModel from "../models/admin.model";
import userModel from "../models/user.model";
import rideModel from "../models/ride.model";
import driverModel from "../models/driver.model";
import paymentModel from "../models/payment.model";
import prisma from "../config/prisma";

import { KafkaTopics } from "../config/kafka";
import { paymentRefundQueue } from "../queues/paymentRefund.queue";

/* ======================================================
   ADMIN SERVICE — CORE ENGINE
====================================================== */

export const Keys = {
  blockUser: (userId: string) => `admin:block:${userId}`,
  featureFlag: (flag: string) => `admin:feature:${flag}`,
  session: (adminId: string) => `admin:session:${adminId}`,
};

export const loginAdmin = async (email: string, passwordPlain: string) => {
  const admin = await adminModel.findByEmail(email);
  if (!admin || !admin.isActive) {
    throw new ApiError(401, "Invalid credentials or inactive account");
  }

  const isMatch = await bcrypt.compare(passwordPlain, admin.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const accessToken = jwt.sign(
    {
      id: admin.id,
      roleId: admin.roleId,
      type: "admin",
      tokenVersion: 1, // simplified for MVP
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "1h", issuer: "auth-service", audience: "uber-clone" }
  );

  // MVP §REDIS DESIGN - admin:session:{adminId} -> EX 3600
  if (redisClient.isReady) {
    await redisClient.set(Keys.session(admin.id), accessToken, { EX: 3600 });
  }

  await createAuditLog(admin.id, "LOGIN", "Admin", admin.id, null, crypto.randomUUID());

  return { accessToken, adminId: admin.id };
};

/* ---- ACTIONS ---- */

export const blockUser = async (adminId: string, userId: string, traceId: string) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });

  if (redisClient.isReady) {
    await redisClient.set(Keys.blockUser(userId), "1"); // No EX — persistent
  }

  await createAuditLog(adminId, "BLOCK_USER", "User", userId, { reason: "Admin blocked" }, traceId);
  logger.info({ adminId, userId }, "User blocked globally");
};

export const unblockUser = async (adminId: string, userId: string, traceId: string) => {
  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.update({ where: { id: userId }, data: { isActive: true } });

  if (redisClient.isReady) {
    await redisClient.del(Keys.blockUser(userId));
  }

  await createAuditLog(adminId, "UNBLOCK_USER", "User", userId, null, traceId);
  logger.info({ adminId, userId }, "User unblocked globally");
};

export const forceCancelRide = async (adminId: string, rideId: string, traceId: string) => {
  const ride = await rideModel.findById(rideId);
  if (!ride) throw new ApiError(404, "Ride not found");

  // Only cancel if not completed or already cancelled
  if (["COMPLETED", "CANCELLED"].includes(ride.status)) {
    throw new ApiError(400, "Cannot cancel a completed or already cancelled ride");
  }

  // Transactional Outbox: DB update + event insert in single transaction
  await prisma.$transaction(async (tx) => {
    try {
      await tx.ride.updateMany({
        where: {
          id: rideId,
          status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] },
        },
        data: { status: "CANCELLED" },
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
        return;
      }
      throw err;
    }

    await insertOutboxEvent(tx, KafkaTopics.RIDE_CANCELLED, buildCloudEvent(
      "ride.cancelled",
      {
        rideId,
        userId: ride.userId,
        driverId: ride.driverId,
      },
      traceId,
      "admin-service"
    ));
  });

  await createAuditLog(adminId, "FORCE_CANCEL_RIDE", "Ride", rideId, null, traceId);
  logger.warn({ adminId, rideId }, "Ride forcefully cancelled by Admin (outbox event queued)");
};

export const forceCompleteRide = async (adminId: string, rideId: string, traceId: string) => {
  const ride = await rideModel.findById(rideId);
  if (!ride) throw new ApiError(404, "Ride not found");

  if (["COMPLETED_UNPAID", "COMPLETED_PAID", "CANCELLED"].includes(ride.status)) {
    throw new ApiError(400, "Cannot complete a ride already completed or cancelled");
  }

  // Transactional Outbox: DB update + event insert in single transaction
  await prisma.$transaction(async (tx) => {
    try {
      await tx.ride.updateMany({
        where: {
          id: rideId,
          status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] },
        },
        data: { status: "COMPLETED_UNPAID" },
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
        return;
      }
      throw err;
    }

    await insertOutboxEvent(tx, KafkaTopics.RIDE_COMPLETED, buildCloudEvent(
      "ride.completed",
      {
        rideId,
        userId: ride.userId,
        driverId: ride.driverId,
      },
      traceId,
      "admin-service"
    ));
  });

  await createAuditLog(adminId, "FORCE_COMPLETE_RIDE", "Ride", rideId, null, traceId);
  logger.info({ adminId, rideId }, "Ride forcefully completed by Admin (outbox event queued)");
};

export const dispatchRefund = async (adminId: string, paymentId: string, amount: number, traceId: string) => {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (!payment.gatewayTransactionId) throw new ApiError(400, "Payment has no gateway transaction ID");

  await paymentModel.updateStatus(paymentId, "SUCCESS", "REFUND_PROCESSING");

  await paymentRefundQueue.add(`refund:${paymentId}`, {
    paymentId,
    rideId: payment.rideId,
    gatewayTransactionId: payment.gatewayTransactionId,
    amount,
    traceId,
  }, { priority: 1 });

  await createAuditLog(adminId, "DISPATCH_REFUND", "Payment", paymentId, { amount }, traceId);
  logger.info({ adminId, paymentId, amount }, "Refund dispatched to queue by Admin");
};

/* ---- FEATURE FLAGS ---- */

export const toggleFeatureFlag = async (adminId: string, flagName: string, enabled: boolean, traceId: string) => {
  if (redisClient.isReady) {
    await redisClient.set(Keys.featureFlag(flagName), enabled ? "1" : "0");
  }

  await createAuditLog(adminId, "TOGGLE_FEATURE", "System", flagName, { enabled }, traceId);
  logger.info({ adminId, flagName, enabled }, "Feature flag toggled");
};

export const getFeatureFlag = async (flagName: string): Promise<boolean> => {
  if (redisClient.isReady) {
    const val = await redisClient.get(Keys.featureFlag(flagName));
    return val === "1";
  }
  return false;
};

/* ---- USER / DRIVER MANAGEMENT ---- */

export const getAllUsers = async (limit: number, cursor?: string) => {
  return adminModel.findAllUsers(limit, cursor);
};

export const searchUsers = async (query: string, limit: number) => {
  return adminModel.searchUsers(query, limit);
};

export const getAllDrivers = async (limit: number, cursor?: string, status?: any) => {
  return adminModel.findAllDrivers(limit, cursor, status);
};

export const suspendDriver = async (adminId: string, driverId: string, traceId: string) => {
  const driver = await driverModel.findById(driverId);
  if (!driver) throw new ApiError(404, "Driver not found");

  // Since PRISMA schema doesn't have an INACTIVE driver status, we'll offline them and rely on user account suspension
  await driverModel.updateStatus(driverId, "OFFLINE");
  // Important: also suspend the user record to prevent them from going back online
  await prisma.user.update({ where: { id: driver.userId }, data: { isActive: false } });

  await createAuditLog(adminId, "SUSPEND_DRIVER", "Driver", driverId, null, traceId);
  logger.info({ adminId, driverId }, "Driver suspended");
};

export const unsuspendDriver = async (adminId: string, driverId: string, traceId: string) => {
  const driver = await driverModel.findById(driverId);
  if (!driver) throw new ApiError(404, "Driver not found");

  await driverModel.updateStatus(driverId, "OFFLINE"); // Set back to OFFLINE to allow them to go ON_TRIP/WAITING
  // Unsuspend the user
  await prisma.user.update({ where: { id: driver.userId }, data: { isActive: true } });

  await createAuditLog(adminId, "UNSUSPEND_DRIVER", "Driver", driverId, null, traceId);
  logger.info({ adminId, driverId }, "Driver unsuspended");
};

export const approveDriverDocument = async (adminId: string, documentId: string, approved: boolean, traceId: string) => {
  try {
    await adminModel.updateDriverDocumentVerified(documentId, approved);
    await createAuditLog(adminId, approved ? "APPROVE_DOCUMENT" : "REJECT_DOCUMENT", "DriverDocument", documentId, null, traceId);
    logger.info({ adminId, documentId, approved }, "Driver document status updated");
  } catch (err) {
    throw new ApiError(404, "Document not found or update failed");
  }
};

/* ---- SYSTEM ---- */

export const getSystemHealth = async () => {
  // A real implementation would ping Redis, Kafka, and Postgres
  const redisHealthy = redisClient.isReady;
  
  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (err) {
    dbHealthy = false;
  }

  return {
    status: redisHealthy && dbHealthy ? "OK" : "DEGRADED",
    services: {
      redis: redisHealthy ? "UP" : "DOWN",
      database: dbHealthy ? "UP" : "DOWN",
      // kafka state would ideally use an admin client or metrics
      kafka: "UNKNOWN", 
    },
    timestamp: new Date().toISOString(),
  };
};

/* ---- AUDIT ---- */

export const createAuditLog = async (
  adminId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata: any,
  traceId: string
) => {
  await adminModel.createAuditLog({
    adminId,
    action,
    entity,
    entityId,
    metadata,
    traceId,
  });
};

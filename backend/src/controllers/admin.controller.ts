import { Request, Response } from "express";
import * as adminService from "../services/admin.service";
import adminModel from "../models/admin.model";
import userModel from "../models/user.model";
import driverModel from "../models/driver.model";
import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middlewares/auth.middleware";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { accessToken, adminId } = await adminService.loginAdmin(email, password);

  return apiResponse(res, 200, "Admin login successful", { accessToken, adminId });
});

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor as string | undefined;
  
  const result = await adminService.getAllUsers(limit, cursor);
  return apiResponse(res, 200, "Users retrieved", result);
});

export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  if (!query) return apiResponse(res, 400, "Query parameter 'q' is required");
  
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const users = await adminService.searchUsers(query, limit);
  return apiResponse(res, 200, "Users found", { users });
});

export const getDrivers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cursor = req.query.cursor as string | undefined;
  const status = req.query.status;
  
  const result = await adminService.getAllDrivers(limit, cursor, status);
  return apiResponse(res, 200, "Drivers retrieved", result);
});

export const blockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: userId } = req.params;
  const traceId = req.traceId!;

  await adminService.blockUser(adminId, userId as string, traceId);
  return apiResponse(res, 200, "User blocked successfully");
});

export const unblockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: userId } = req.params;
  const traceId = req.traceId!;

  await adminService.unblockUser(adminId, userId as string, traceId);
  return apiResponse(res, 200, "User unblocked successfully");
});

export const suspendDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: driverId } = req.params;
  const traceId = req.traceId!;

  await adminService.suspendDriver(adminId, driverId as string, traceId);
  return apiResponse(res, 200, "Driver suspended successfully");
});

export const unsuspendDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: driverId } = req.params;
  const traceId = req.traceId!;

  await adminService.unsuspendDriver(adminId, driverId as string, traceId);
  return apiResponse(res, 200, "Driver unsuspended successfully");
});

export const approveDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: documentId } = req.params;
  const { approved } = req.body;
  const traceId = req.traceId!;

  await adminService.approveDriverDocument(adminId, documentId as string, approved, traceId);
  return apiResponse(res, 200, "Document status updated");
});

export const forceCancelRide = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: rideId } = req.params;
  const traceId = req.traceId!;

  await adminService.forceCancelRide(adminId, rideId as string, traceId);
  return apiResponse(res, 200, "Ride forcibly cancelled");
});

export const forceCompleteRide = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id: rideId } = req.params;
  const traceId = req.traceId!;

  await adminService.forceCompleteRide(adminId, rideId as string, traceId);
  return apiResponse(res, 200, "Ride forcibly completed");
});

export const dispatchRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { paymentId, amount } = req.body;
  const traceId = req.traceId!;

  await adminService.dispatchRefund(adminId, paymentId, amount, traceId);
  return apiResponse(res, 200, "Refund dispatched");
});

export const toggleFeature = asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminId = req.user!.id;
  const { flagName, enabled } = req.body;
  const traceId = req.traceId!;

  await adminService.toggleFeatureFlag(adminId, flagName, enabled, traceId);
  return apiResponse(res, 200, "Feature flag toggled");
});

export const getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const health = await adminService.getSystemHealth();
  return apiResponse(res, 200, "System health retrieved", health);
});

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cursor = req.query.cursor as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  
  const filters: any = {};
  if (req.query.adminId) filters.adminId = req.query.adminId as string;
  if (req.query.entity) filters.entity = req.query.entity as string;
  if (req.query.from) filters.from = new Date(req.query.from as string);
  if (req.query.to) filters.to = new Date(req.query.to as string);

  const result = await adminModel.getAuditLogs(limit, cursor, filters);

  return apiResponse(res, 200, "Audit logs retrieved", result);
});

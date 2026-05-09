import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import env from "../config/env";
import ApiError from "../utils/ApiError";
import { isAccessTokenBlacklisted } from "../services/auth.service";
import userModel from "../models/user.model";
import adminModel from "../models/admin.model";
import { redisClient } from "../config/redis";

export interface AuthRequest extends Request {
  user?: { id: string; role?: string };
  traceId?: string;
}

/* ======================================================
   VERIFY ACCESS TOKEN
====================================================== */

export const verifyAccessToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {

    const traceId = (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();
    req.traceId = traceId;

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Access token missing");
    }

    const token = authHeader.split(" ")[1];
    if (!token) throw new ApiError(401, "Invalid authorization header");

    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) throw new ApiError(401, "Token revoked");

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "auth-service",
      audience: "uber-clone",
    }) as {
      id: string;
      type: string;
      tokenVersion: number;
      iat: number;
      exp: number;
    };

    if (decoded.type !== "access") {
      throw new ApiError(401, "Invalid token type");
    }

    /* Always hit DB for auth checks — cache strips sensitive fields */
    const user = await userModel.findByIdFull(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, "User not found or inactive");
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, "Token invalidated. Please login again.");
    }

    /* REDIS GLOBAL BLOCK CHECK */
    if (redisClient.isReady) {
      const isBlocked = await redisClient.get(`admin:block:${decoded.id}`);
      if (isBlocked) {
        throw new ApiError(403, "Account suspended by Administrator.");
      }
    }

    req.user = { id: decoded.id, role: user.role };
    next();

  } catch (error: unknown) {

    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Access token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid token"));
    }
    next(error);

  }
};

/* ======================================================
   VERIFY ACCESS TOKEN — ALLOW EXPIRED
====================================================== */

export const verifyAccessTokenAllowExpired = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {

    const traceId = (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();
    req.traceId = traceId;

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) return next();

    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) throw new ApiError(401, "Token already revoked");

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "auth-service",
      audience: "uber-clone",
      ignoreExpiration: true,
    }) as {
      id: string;
      type: string;
      tokenVersion: number;
      iat: number;
      exp: number;
    };

    if (decoded.type !== "access") return next();

    const user = await userModel.findByIdFull(decoded.id);
    if (!user) return next();

    if (decoded.tokenVersion !== user.tokenVersion) return next();

    req.user = { id: decoded.id, role: user.role };
    next();

  } catch (error: unknown) {

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid token"));
    }
    next(error);

  }
};

/* ======================================================
   REQUIRE ROLE (RBAC)
====================================================== */
export const requireRole = (role: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (req.user.role !== role) {
      return next(new ApiError(403, "Forbidden — insufficient permissions"));
    }

    next();
  };
};

/* ======================================================
   VERIFY ADMIN TOKEN
====================================================== */
export const verifyAdminToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const traceId = (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();
    req.traceId = traceId;
    // Dev bypass: if enabled, allow requests with `x-dev-admin: 1` header to act as admin
    if (process.env.DEV_BYPASS_ADMIN_AUTH === 'true') {
      const devHeader = (req.headers['x-dev-admin'] as string) || (req.headers['x-dev-admin'] as unknown as string);
      if (devHeader === '1' || devHeader === 'true') {
        // attach a lightweight admin identity for dev testing
        req.user = { id: 'dev-admin', role: 'superadmin' };
        return next();
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Access token missing");
    }

    const token = authHeader.split(" ")[1];
    if (!token) throw new ApiError(401, "Invalid authorization header");

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "auth-service",
      audience: "uber-clone",
    }) as {
      id: string;
      roleId: string;
      type: string;
      tokenVersion: number;
    };

    if (decoded.type !== "admin") {
      throw new ApiError(401, "Invalid token type");
    }

    // Usually we would hit Redis or DB to ensure admin is still active
    const admin = await adminModel.findById(decoded.id);
    if (!admin || !admin.isActive) {
      throw new ApiError(401, "Admin account disabled/not found");
    }

    req.user = { id: admin.id, role: admin.role.name };
    // You could also stick permissions in req.user here

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Access token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid token"));
    }
    next(error);
  }
};

/* ======================================================
   REQUIRE ADMIN PERMISSION (RBAC inside Admin routes)
====================================================== */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    // allow dev bypass header to skip permission checks when enabled
    if (process.env.DEV_BYPASS_ADMIN_AUTH === 'true') {
      const devHeader = (req.headers['x-dev-admin'] as string) || (req.headers['x-dev-admin'] as unknown as string);
      if (devHeader === '1' || devHeader === 'true') return next();
    }

    if (!req.user) return next(new ApiError(401, "Unauthorized"));

    // Quick lookup via DB (in highly scaled systems, serialize permission to JWT or Redis)
    const admin = await adminModel.findById(req.user.id);
    if (!admin) return next(new ApiError(401, "Admin not found"));

    const permissions = admin.role.permissions as string[];
    if (!permissions.includes(permission)) {
      return next(new ApiError(403, `Forbidden — requires ${permission}`));
    }

    next();
  };
};
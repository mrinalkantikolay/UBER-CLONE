import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import ApiError from "../utils/ApiError";

/*
 * Role-based access control middleware.
 * Must be placed AFTER verifyAccessToken in the middleware chain
 * since it reads req.user.role set by the auth middleware.
 *
 * Usage:
 *   router.patch("/admin-route", verifyAccessToken, requireRole("ADMIN"), controller);
 *   router.patch("/multi-role", verifyAccessToken, requireRole("ADMIN", "DRIVER"), controller);
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required role: ${roles.join(" or ")}`)
      );
    }

    next();
  };
};

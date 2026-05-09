import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import ApiError from "../utils/ApiError";

/*
 * Zod validation middleware.
 * Uses next(error) instead of throw so it is safe in both
 * Express 4 and Express 5 without an async wrapper.
 * Replaces req.body with the parsed and coerced Zod output
 * so downstream handlers receive clean typed data.
 */
export const validate =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction) => {

      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.issues.map((issue) => issue.message);
        return next(new ApiError(400, "Validation failed", errors));
      }

      req.body = result.data;
      next();
    };

/*
 * Zod validation middleware for URL params (e.g. :rideId).
 * Same pattern as validate() but parses req.params.
 */
export const validateParams =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction) => {

      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.issues.map((issue) => issue.message);
        return next(new ApiError(400, "Invalid URL parameters", errors));
      }

      /* Merge parsed params back — ensures coerced types */
      Object.assign(req.params, result.data);
      next();
    };

/*
 * Zod validation middleware for Query params (e.g. ?from=xxx&to=yyy).
 */
export const validateQuery =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction) => {

      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.issues.map((issue) => issue.message);
        return next(new ApiError(400, "Invalid query parameters", errors));
      }

      Object.assign(req.query, result.data);
      next();
    };
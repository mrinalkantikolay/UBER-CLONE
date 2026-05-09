import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { asyncLocalStorage } from "../config/logContext";

export interface RequestWithId extends Request {
  requestId?: string;
  traceId?: string;
}

/*
 * Unified request identity middleware.
 * Reads x-trace-id from upstream (API gateway, load balancer).
 * Falls back to a fresh UUID if not provided.
 * Sets both req.requestId and req.traceId to the same value
 * so all log calls use a single consistent correlation ID.
 * Reflects the value back in X-Request-Id and X-Trace-Id
 * so clients can correlate their requests with server logs.
 */
export const requestIdMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
) => {
  const id = (req.headers["x-trace-id"] as string) ?? randomUUID();

  req.requestId = id;
  req.traceId = id;

  res.setHeader("X-Request-Id", id);
  res.setHeader("X-Trace-Id", id);

  asyncLocalStorage.run({ requestId: id, traceId: id }, () => {
    next();
  });
};
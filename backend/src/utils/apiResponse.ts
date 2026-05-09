import { Response } from "express";
import { getLogContext } from "../config/logContext";

/**
 * Standard API response wrapper.
 * Every endpoint must use this to guarantee a consistent shape:
 *   { success, message, traceId, data? }
 *
 * traceId is auto-resolved from AsyncLocalStorage so controllers
 * don't need to pass it explicitly.
 */
export const apiResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data?: Record<string, unknown>
) => {
  const ctx = getLogContext();
  const traceId = (ctx?.traceId as string) ?? "unknown";

  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    traceId,
    ...(data && { data }),
  });
};

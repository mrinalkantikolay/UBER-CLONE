import { Response } from "express";
import * as analyticsService from "../services/analytics.service";
import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middlewares/auth.middleware";

/* ======================================================
   1. GET SYSTEM METRICS
   GET /api/analytics/system
====================================================== */
export const getSystemStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { from, to, city } = req.query;

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    const cityStr = (city as string) || "global";

    const stats = await analyticsService.getSystemMetrics(cityStr, fromDate, toDate);

    return apiResponse(res, 200, "System metrics retrieved", stats);
  }
);

/* ======================================================
   2. GET RIDE DEMAND
   GET /api/analytics/demand
====================================================== */
export const getDemandStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { from, to, city } = req.query;

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    const cityStr = (city as string) || "global";

    const stats = await analyticsService.getRideDemandStats(cityStr, fromDate, toDate);

    return apiResponse(res, 200, "Demand stats retrieved", { stats });
  }
);

/* ======================================================
   3. GET SURGE MULTIPLIER
   GET /api/analytics/surge/:city
====================================================== */
export const getSurge = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { city } = req.params;
    const surge = await analyticsService.getSurgeMultiplier(city as string);
    return apiResponse(res, 200, "Surge retrieved", { city, surge });
  }
);

/* ======================================================
   4. GET REVENUE
   GET /api/analytics/revenue
====================================================== */
export const getRevenue = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { from, to, city } = req.query;

    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    const cityStr = (city as string) || "global";

    const stats = await analyticsService.getRevenueStats(cityStr, fromDate, toDate);

    return apiResponse(res, 200, "Revenue stats retrieved", { stats });
  }
);

/* ======================================================
   5. GET REAL-TIME METRICS (MVP Core Function #7)
   GET /api/analytics/realtime
   
   Fast Redis O(1) lookups for live dashboard.
====================================================== */
export const getRealTimeMetrics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cityStr = (req.query.city as string) || "global";
    const metrics = await analyticsService.getRealTimeMetrics(cityStr);

    return apiResponse(res, 200, "Real-time metrics retrieved", metrics);
  }
);

/* ======================================================
   6. GET ANOMALY ALERTS (MVP Core Function #9)
   GET /api/analytics/anomalies
====================================================== */
export const getAnomalyAlerts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cityStr = (req.query.city as string) || "global";
    const result = await analyticsService.runAnomalyDetection(cityStr);

    return apiResponse(res, 200, "Anomaly alerts retrieved", result);
  }
);

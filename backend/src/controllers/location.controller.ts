import { Request, Response } from "express";
import * as locationService from "../services/location.service";

import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";

import { AuthRequest } from "../middlewares/auth.middleware";
import crypto from "crypto";

/* ======================================================
   TRACE ID
====================================================== */

const getTraceId = (req: Request): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   1. UPDATE DRIVER LOCATION
====================================================== */

export const updateDriverLocation = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const { lat, lng } = req.body;

    const result = await locationService.updateDriverLocation(userId, lat, lng, traceId);

    return apiResponse(res, 200, "Location updated", result);
  }
);

/* ======================================================
   2. GET NEARBY DRIVERS
====================================================== */

export const getNearbyDrivers = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const { lat, lng, radiusKm, limit } = req.body;

    const drivers = await locationService.getNearbyDrivers(lat, lng, radiusKm, limit, traceId);

    return apiResponse(res, 200, "Nearby drivers retrieved", {
      drivers,
      count: drivers.length,
    });
  }
);

/* ======================================================
   3. UPDATE RIDER LOCATION
====================================================== */

export const updateRiderLocation = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const { lat, lng } = req.body;

    const result = await locationService.updateRiderLocation(userId, lat, lng, traceId);

    return apiResponse(res, 200, "Rider location updated", result);
  }
);

/* ======================================================
   4. CALCULATE ETA
====================================================== */

export const calculateETA = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const { originLat, originLng, destLat, destLng } = req.body;

    const eta = await locationService.calculateETA(
      originLat, originLng, destLat, destLng, traceId
    );

    return apiResponse(res, 200, "ETA calculated", eta);
  }
);

/* ======================================================
   5. GET ROUTE PATH
====================================================== */

export const getRoutePath = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const { originLat, originLng, destLat, destLng } = req.body;

    const route = await locationService.getRoutePath(
      originLat, originLng, destLat, destLng, traceId
    );

    return apiResponse(res, 200, "Route path calculated", route);
  }
);

/* ======================================================
   6. REMOVE DRIVER FROM POOL
====================================================== */

export const removeDriverFromPool = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const result = await locationService.removeDriverFromPool(userId, traceId);

    return apiResponse(res, 200, result.message);
  }
);

/* ======================================================
   7. GET DRIVER LAST KNOWN LOCATION
====================================================== */

export const getDriverLastLocation = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const location = await locationService.getDriverLastLocation(userId, traceId);

    return apiResponse(res, 200, "Driver location retrieved", location);
  }
);

import { Request, Response } from "express";
import * as rideService from "../services/ride.service";

import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import { RideDTO } from "../dto/ride.dto";

import { AuthRequest } from "../middlewares/auth.middleware";
import crypto from "crypto";

/* ======================================================
   TRACE ID
====================================================== */

const getTraceId = (req: Request): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   1. CREATE RIDE
====================================================== */

export const createRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const ride = await rideService.createRide(userId, req.body, traceId);

    return apiResponse(res, 201, "Ride requested", {
      ride: RideDTO.toDTO(ride),
    });
  }
);

/* ======================================================
   2. CANCEL RIDE
   PATCH /rides/:rideId/cancel
====================================================== */

export const cancelRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const rideId = req.params.rideId as string;

    const ride = await rideService.cancelRide(userId, { rideId }, traceId);

    return apiResponse(res, 200, "Ride cancelled", {
      ride: RideDTO.toDTO(ride),
    });
  }
);

/* ======================================================
   3. COMPLETE RIDE
   PATCH /rides/:rideId/complete
====================================================== */

export const completeRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const rideId = req.params.rideId as string;

    const ride = await rideService.completeRide(userId, rideId, traceId);

    return apiResponse(res, 200, "Ride completed", {
      ride: RideDTO.toDTO(ride),
    });
  }
);

/* ======================================================
   4. GET ACTIVE RIDE
====================================================== */

export const getActiveRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const ride = await rideService.getActiveRide(userId, traceId);

    if (!ride) {
      return apiResponse(res, 200, "No active ride", { ride: null });
    }

    return apiResponse(res, 200, "Active ride retrieved", {
      ride: RideDTO.toDTO(ride),
    });
  }
);

/* ======================================================
   5. RIDE HISTORY
   GET /rides/history?cursor=x&limit=10
====================================================== */

export const getRideHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;

    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await rideService.getRideHistory(userId, limit, cursor, traceId);

    return apiResponse(res, 200, "Ride history retrieved", {
      rides: RideDTO.toDTOArray(result.rides),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }
);

/* ======================================================
   6. RATE RIDE
   POST /rides/:rideId/rate
====================================================== */

export const rateRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const traceId = getTraceId(req);
    const userId = req.user!.id;
    const rideId = req.params.rideId as string;

    const rating = await rideService.rateRide(
      userId,
      { rideId, ...req.body },
      traceId
    );

    return apiResponse(res, 201, "Ride rated", { rating });
  }
);

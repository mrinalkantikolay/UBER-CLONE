import { Response } from "express";
import crypto from "crypto";

import * as notificationService from "../services/notification.service";
import asyncHandler from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";
import { AuthRequest } from "../middlewares/auth.middleware";

/* ======================================================
   TRACE ID
====================================================== */

const getTraceId = (req: AuthRequest): string =>
  (req.headers["x-trace-id"] as string) ?? crypto.randomUUID();

/* ======================================================
   1. GET UNREAD COUNT
   GET /api/notifications/unread-count
====================================================== */

export const getUnreadCount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);
    return apiResponse(res, 200, "Unread count retrieved", { count });
  }
);

/* ======================================================
   2. GET NOTIFICATION HISTORY
   GET /api/notifications/history?cursor=x&limit=20
====================================================== */

export const getHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await notificationService.getHistory(userId, limit, cursor);

    return apiResponse(res, 200, "Notification history retrieved", {
      notifications: result.notifications,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }
);

/* ======================================================
   3. MARK AS READ
   PATCH /api/notifications/:id/read
====================================================== */

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const notificationId = req.params.id as string;

    await notificationService.markAsRead(notificationId, userId);
    return apiResponse(res, 200, "Notification marked as read");
  }
);

/* ======================================================
   4. GET PREFERENCES
   GET /api/notifications/preferences
====================================================== */

export const getPreferences = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const prefs = await notificationService.getPreferences(userId);
    return apiResponse(res, 200, "Preferences retrieved", { preferences: prefs });
  }
);

/* ======================================================
   5. UPDATE PREFERENCES
   PUT /api/notifications/preferences
====================================================== */

export const updatePreferences = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const prefs = await notificationService.updatePreferences(userId, req.body);
    return apiResponse(res, 200, "Preferences updated", { preferences: prefs });
  }
);

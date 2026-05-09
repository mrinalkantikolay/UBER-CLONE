import prisma from "../config/prisma";
import { Prisma, Notification, NotificationPreference, NotificationStatus } from "@prisma/client";

/* ======================================================
   NOTIFICATION MODEL — Data access layer
====================================================== */

class NotificationModel {

  /* ---- CREATE NOTIFICATION ---- O(1) */

  async create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  /* ---- FIND BY ID ---- O(1) PK */

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  /* ---- UPDATE STATUS ---- O(1) atomic */

  async updateStatus(id: string, status: NotificationStatus): Promise<Notification | null> {
    try {
      return await prisma.notification.update({
        where: { id },
        data: { status },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return null;
      }
      throw err;
    }
  }

  /* ---- MARK AS READ ---- O(1) */

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    try {
      return await prisma.notification.update({
        where: { id, userId },
        data: { isRead: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return null;
      }
      throw err;
    }
  }

  /* ---- NOTIFICATION HISTORY (cursor-based) ----
   * O(log N) via [userId, createdAt] index.
   */
  async findByUserId(
    userId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });
  }

  /* ---- UNREAD COUNT ---- O(1) via [userId, isRead] index */

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /* ======================================================
     PREFERENCES
  ====================================================== */

  async getPreferences(userId: string): Promise<NotificationPreference | null> {
    return prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async upsertPreferences(
    userId: string,
    data: { email?: boolean; sms?: boolean; push?: boolean }
  ): Promise<NotificationPreference> {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}

export default new NotificationModel();

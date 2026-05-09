import prisma from "../config/prisma";
import { Prisma, User } from "@prisma/client";
import { getCachedUserById, setCachedUser } from "../cache/userCache";

class UserModel {

  async createUser(
    data: Prisma.UserCreateInput
  ): Promise<User> {
    const user = await prisma.user.create({ data });
    try { await setCachedUser(user.id, user as unknown as Record<string, unknown>); } catch {}
    return user;
  }

  async findByEmail(
    email: string
  ): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      try { await setCachedUser(user.id, user as unknown as Record<string, unknown>); } catch {}
    }
    return user;
  }

  /*
   * findById — used for profile reads.
   * Returns cached version (without sensitive fields) when available.
   * Auth operations that need password/tokenVersion must use findByIdFull().
   */
  async findById(
    id: string
  ): Promise<User | null> {
    const cached = await getCachedUserById(id);
    if (cached) return cached as unknown as User;

    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      try { await setCachedUser(id, user as unknown as Record<string, unknown>); } catch {}
    }
    return user;
  }

  /*
   * findByIdFull — always hits DB.
   * Used by auth middleware and any operation that needs
   * password, tokenVersion, failedAttempts, or lockedUntil.
   * These fields are intentionally NOT cached in Redis.
   */
  async findByIdFull(
    id: string
  ): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(
    userId: string,
    password: string
  ): Promise<User> {
    const user = await prisma.user.update({ where: { id: userId }, data: { password } });
    try { await setCachedUser(user.id, user as unknown as Record<string, unknown>); } catch {}
    return user;
  }

  /*
   * Called by resetPassword in auth.service.
   * Updates password and increments tokenVersion atomically.
   * All existing access and refresh tokens carry the old version
   * and are immediately rejected on next use.
   */
  async updatePasswordAndIncrementVersion(
    userId: string,
    hashedPassword: string
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });
    try { await setCachedUser(user.id, user as unknown as Record<string, unknown>); } catch {}
    return user;
  }

  async incrementFailedAttempts(
    userId: string
  ): Promise<User> {
    const user = await prisma.user.update({ where: { id: userId }, data: { failedAttempts: { increment: 1 } } });
    // Don't update cache — failedAttempts is not cached
    return user;
  }

  async resetFailedAttempts(
    userId: string
  ): Promise<User> {
    const user = await prisma.user.update({ where: { id: userId }, data: { failedAttempts: 0, lockedUntil: null } });
    return user;
  }

  async lockAccount(
    userId: string,
    lockUntil: Date
  ): Promise<User> {
    const user = await prisma.user.update({ where: { id: userId }, data: { lockedUntil: lockUntil } });
    return user;
  }

  /* ======================================================
     PROFILE MANAGEMENT
  ====================================================== */

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  }

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; profilePhotoUrl?: string }
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    try { await setCachedUser(user.id, user as unknown as Record<string, unknown>); } catch {}
    return user;
  }

  async deactivateAccount(userId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    // Remove from cache — deactivated users should not be cached
    try {
      const { redisClient } = await import("../config/redis");
      if (redisClient.isReady) {
        await redisClient.del(`user_profile:${userId}`);
      }
    } catch {}
    return user;
  }

}

export default new UserModel();
import prisma from "../config/prisma";
import { Prisma, LoginAttempt, LoginAttemptType } from "@prisma/client";

class LoginAttemptModel {

  async recordAttempt(
    data: Prisma.LoginAttemptCreateInput
  ): Promise<LoginAttempt> {
    return prisma.loginAttempt.create({ data });
  }

  async getAttemptsByEmail(
    email: string,
    limit = 10
  ): Promise<LoginAttempt[]> {
    return prisma.loginAttempt.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getAttemptsByIp(
    ip: string,
    limit = 10
  ): Promise<LoginAttempt[]> {
    return prisma.loginAttempt.findMany({
      where: { ip },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getAttemptsByUserId(
    userId: string,
    limit = 10
  ): Promise<LoginAttempt[]> {
    return prisma.loginAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getAttemptsByType(
    type: LoginAttemptType,
    limit = 10
  ): Promise<LoginAttempt[]> {
    return prisma.loginAttempt.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async countFailedAttemptsSince(
    email: string,
    since: Date
  ): Promise<number> {
    return prisma.loginAttempt.count({
      where: {
        email,
        type: "FAILED",
        createdAt: { gte: since },
      },
    });
  }

}

export default new LoginAttemptModel();
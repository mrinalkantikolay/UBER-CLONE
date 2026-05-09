import prisma from "../config/prisma";
import { Prisma, Admin, Role, AuditLog, User, Driver, DriverStatus } from "@prisma/client";

/**
 * Data Access Layer for Admin entities and Role definitions
 */
class AdminModel {
  /* ---- ADMINS ---- */

  async findByEmail(email: string): Promise<Admin | null> {
    return prisma.admin.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<(Admin & { role: Role }) | null> {
    return prisma.admin.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async createAdmin(data: Prisma.AdminUncheckedCreateInput): Promise<Admin> {
    return prisma.admin.create({ data });
  }

  /* ---- ROLES ---- */

  async findRoleByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { name } });
  }

  async createRole(data: Prisma.RoleCreateInput): Promise<Role> {
    return prisma.role.create({ data });
  }

  /* ---- USER MANAGEMENT ---- */

  /**
   * Get All Users — cursor-paginated O(log N).
   * MVP §USER & DRIVER MANAGEMENT
   */
  async findAllUsers(
    limit: number = 20,
    cursor?: string
  ): Promise<{ users: User[]; nextCursor: string | null }> {
    const users = await prisma.user.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        profilePhotoUrl: true,
        updatedAt: true,
        password: false,
        tokenVersion: false,
        failedAttempts: false,
        lockedUntil: false,
      },
    });

    const nextCursor = users.length === limit ? users[users.length - 1].id : null;
    return { users: users as unknown as User[], nextCursor };
  }

  /**
   * Search Users by name, email, or phone — case-insensitive.
   * MVP §SEARCH & FILTER
   */
  async searchUsers(
    query: string,
    limit: number = 20
  ): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  /* ---- DRIVER MANAGEMENT ---- */

  /**
   * Get All Drivers — with optional status filter.
   * MVP §USER & DRIVER MANAGEMENT
   */
  async findAllDrivers(
    limit: number = 20,
    cursor?: string,
    statusFilter?: DriverStatus
  ): Promise<{ drivers: Driver[]; nextCursor: string | null }> {
    const drivers = await prisma.driver.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        vehicle: true,
      },
    });

    const nextCursor = drivers.length === limit ? drivers[drivers.length - 1].id : null;
    return { drivers, nextCursor };
  }

  /**
   * Approve/Reject Driver Document.
   * MVP §DRIVER & DOCUMENT CONTROL
   */
  async updateDriverDocumentVerified(documentId: string, verified: boolean) {
    return prisma.driverDocument.update({
      where: { id: documentId },
      data: { verified },
    });
  }

  /* ---- AUDIT LOGS ---- */

  async createAuditLog(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }

  /**
   * Get Audit Logs — cursor-paginated with filters.
   * MVP §LOGS & MONITORING: filter by adminId, entity, dateRange
   */
  async getAuditLogs(
    limit: number = 50,
    cursor?: string,
    filters?: { adminId?: string; entity?: string; from?: Date; to?: Date }
  ): Promise<{ logs: AuditLog[]; nextCursor: string | null }> {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters?.adminId) where.adminId = filters.adminId;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const nextCursor = logs.length === limit ? logs[logs.length - 1].id : null;
    return { logs, nextCursor };
  }
}

export default new AdminModel();

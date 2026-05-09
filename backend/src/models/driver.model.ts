import prisma from "../config/prisma";
import { Prisma, Driver, DriverStatus } from "@prisma/client";

class DriverModel {

  /* ======================================================
     BASIC CRUD
  ====================================================== */

  async createDriver(data: Prisma.DriverCreateInput): Promise<Driver> {
    return prisma.driver.create({ data });
  }

  async findByUserId(userId: string): Promise<Driver | null> {
    return prisma.driver.findUnique({ where: { userId } });
  }

  async findById(id: string): Promise<Driver | null> {
    return prisma.driver.findUnique({ where: { id } });
  }

  /* ======================================================
     RELATIONS
  ====================================================== */

  async findByUserIdWithRelations(userId: string) {
    return prisma.driver.findUnique({
      where: { userId },
      include: {
        vehicle: true,
        documents: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePhotoUrl: true,
          },
        },
      },
    });
  }

  /* ======================================================
     STATUS
  ====================================================== */

  async updateStatus(driverId: string, status: DriverStatus): Promise<Driver> {
    return prisma.driver.update({
      where: { id: driverId },
      data: { status },
    });
  }

  /* ======================================================
     UPDATE
  ====================================================== */

  async updateDriver(
    driverId: string,
    data: { vehicleNumber?: string; licenseNumber?: string }
  ): Promise<Driver> {
    return prisma.driver.update({
      where: { id: driverId },
      data,
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    return prisma.driver.findUnique({ where: { licenseNumber } });
  }

}

export default new DriverModel();
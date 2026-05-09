import prisma from "../config/prisma";
import { Prisma, Vehicle } from "@prisma/client";

class VehicleModel {

  async createVehicle(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
    return prisma.vehicle.create({ data });
  }

  async findByDriverId(driverId: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { driverId } });
  }

  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { id } });
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { licensePlate } });
  }

  async updateVehicle(
    driverId: string,
    data: Partial<Omit<Vehicle, "id" | "driverId" | "createdAt" | "updatedAt">>
  ): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { driverId },
      data,
    });
  }

  async deleteVehicle(driverId: string): Promise<Vehicle> {
    return prisma.vehicle.delete({ where: { driverId } });
  }

}

export default new VehicleModel();

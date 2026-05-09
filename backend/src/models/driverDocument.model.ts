import prisma from "../config/prisma";
import { Prisma, DriverDocument } from "@prisma/client";

class DriverDocumentModel {

  async createDocument(data: Prisma.DriverDocumentCreateInput): Promise<DriverDocument> {
    return prisma.driverDocument.create({ data });
  }

  async findById(id: string): Promise<DriverDocument | null> {
    return prisma.driverDocument.findUnique({ where: { id } });
  }

  async findByDriverId(driverId: string): Promise<DriverDocument[]> {
    return prisma.driverDocument.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteDocument(id: string): Promise<DriverDocument> {
    return prisma.driverDocument.delete({ where: { id } });
  }

  async verifyDocument(id: string, verified: boolean): Promise<DriverDocument> {
    return prisma.driverDocument.update({
      where: { id },
      data: { verified },
    });
  }

}

export default new DriverDocumentModel();

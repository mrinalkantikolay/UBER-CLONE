import prisma from "../config/prisma";
import { Prisma, PaymentMethod } from "@prisma/client";

class PaymentMethodModel {

  async create(data: Prisma.PaymentMethodCreateInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.create({ data });
  }

  async findByUserId(userId: string): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({ where: { id } });
  }

  async deleteById(id: string): Promise<PaymentMethod> {
    return prisma.paymentMethod.delete({ where: { id } });
  }

}

export default new PaymentMethodModel();

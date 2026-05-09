import prisma from "../config/prisma";
import logger from "../config/logger";

class AnalyticsModel {
  /**
   * Persist micro-batches of RideAnalytics
   */
  async createRideAnalyticsBatch(
    data: { city: string; demand: number; supply: number; timestamp: Date }[]
  ): Promise<void> {
    try {
      await prisma.rideAnalytics.createMany({
        data,
      });
    } catch (error) {
      logger.error({ error }, "Failed to insert RideAnalytics batch");
      throw error;
    }
  }

  /**
   * Persist micro-batches of RevenueAnalytics
   */
  async createRevenueAnalyticsBatch(
    data: { city: string; total: number; timestamp: Date }[]
  ): Promise<void> {
    try {
      await prisma.revenueAnalytics.createMany({
        data,
      });
    } catch (error) {
      logger.error({ error }, "Failed to insert RevenueAnalytics batch");
      throw error;
    }
  }

  /**
   * Get Ride Demand Stats within a time range
   */
  async getRideStats(
    city: string,
    from: Date,
    to: Date
  ): Promise<{ demand: number; supply: number; timestamp: Date }[]> {
    return prisma.rideAnalytics.findMany({
      where: {
        city,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: "asc" },
      select: { demand: true, supply: true, timestamp: true },
    });
  }

  /**
   * Get Revenue Stats within a time range
   */
  async getRevenueStats(
    city: string,
    from: Date,
    to: Date
  ): Promise<{ total: number; timestamp: Date }[]> {
    return prisma.revenueAnalytics.findMany({
      where: {
        city,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: "asc" },
      select: { total: true, timestamp: true },
    });
  }

  /**
   * Get System Metrics (Total demand, total supply, total revenue)
   */
  async getSystemMetrics(city: string, from: Date, to: Date) {
    const rideAgg = await prisma.rideAnalytics.aggregate({
      _sum: {
        demand: true,
        supply: true,
      },
      where: {
        city,
        timestamp: { gte: from, lte: to },
      },
    });

    const revAgg = await prisma.revenueAnalytics.aggregate({
      _sum: {
        total: true,
      },
      where: {
        city,
        timestamp: { gte: from, lte: to },
      },
    });

    return {
      totalDemand: rideAgg._sum.demand || 0,
      totalSupply: rideAgg._sum.supply || 0,
      totalRevenue: revAgg._sum.total || 0,
    };
  }
}

export default new AnalyticsModel();

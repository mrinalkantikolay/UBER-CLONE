import { PrismaClient } from "@prisma/client";
import env from "./env";

/* =========================
   Singleton (prevents multiple
   instances during hot-reload)
========================= */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV !== "production"
        ? ["query", "warn", "error"]
        : ["warn", "error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
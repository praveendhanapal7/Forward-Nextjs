import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createClient() {
  // Strip sslmode from URL so the ssl option below takes full effect
  const dbUrl = (process.env.DATABASE_URL ?? "")
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/[?&]$/, "");
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

type PrismaClientType = ReturnType<typeof createClient>;
const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function withConnectTimeout(rawUrl: string | undefined): string {
  const fallback = "postgresql://127.0.0.1:1/none?connect_timeout=3&pool_timeout=3";
  if (!rawUrl?.trim()) return fallback;

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "10");
    }
    return url.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}connect_timeout=5&pool_timeout=10`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: withConnectTimeout(process.env.DATABASE_URL) },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

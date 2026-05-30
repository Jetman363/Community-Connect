import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pingCache, getCacheBackend } from "@/lib/cache/redis";
import { getQueueStatus } from "@/lib/queue";
import { getUptimeSeconds, snapshotMetrics } from "@/lib/observability/metrics";
import { withDbTimeout } from "@/lib/db/timeout";

export async function GET() {
  const started = Date.now();
  let dbStatus: "ok" | "error" | "unconfigured" = "unconfigured";
  let dbLatencyMs: number | undefined;

  if (process.env.DATABASE_URL) {
    try {
      const t0 = Date.now();
      await withDbTimeout(prisma.$queryRaw`SELECT 1`);
      dbLatencyMs = Date.now() - t0;
      dbStatus = "ok";
    } catch {
      dbStatus = "error";
    }
  }

  const cache = await pingCache();
  const queue = getQueueStatus();
  const backend = await getCacheBackend();

  const healthy = dbStatus !== "error" && cache.ok;
  const body = {
    status: healthy ? "ok" : "degraded",
    service: "community-connect",
    phase: 8,
    uptimeSeconds: getUptimeSeconds(),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - started,
    checks: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      cache: { status: cache.ok ? "ok" : "error", backend, latencyMs: cache.latencyMs },
      queue: { status: "ok", backend: queue.backend, pending: queue.pending },
      socket: {
        status: process.env.NEXT_PUBLIC_SOCKET_URL ? "configured" : "default",
      },
    },
    metrics: snapshotMetrics(),
  };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

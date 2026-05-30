import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { formatPrometheus, snapshotMetrics } from "@/lib/observability/metrics";
import { getQueueStatus } from "@/lib/queue";
import { getCacheBackend, pingCache } from "@/lib/cache/redis";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const format = req.nextUrl.searchParams.get("format");
  const cache = await pingCache();
  const queue = getQueueStatus();
  const backend = await getCacheBackend();

  if (format === "prometheus") {
    const text = formatPrometheus();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json({
    metrics: snapshotMetrics(),
    cache: { backend, ok: cache.ok, latencyMs: cache.latencyMs },
    queue,
    generatedAt: new Date().toISOString(),
  });
}

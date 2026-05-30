import type { NextRequest } from "next/server";
import { CacheKeys } from "@/lib/cache/keys";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

export function clientKey(req: NextRequest, namespace: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  return `${namespace}:${ip}`;
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const cacheKey = CacheKeys.rateLimit(key);
  try {
    const { cacheGet, cacheSet } = await import("@/lib/cache/redis");
    const raw = await cacheGet(cacheKey);
    const now = Date.now();
    if (!raw) {
      await cacheSet(cacheKey, JSON.stringify({ count: 1, resetAt: now + windowMs }), Math.ceil(windowMs / 1000));
      return { ok: true, remaining: limit - 1 };
    }
    const entry = JSON.parse(raw) as RateLimitEntry;
    if (now > entry.resetAt) {
      await cacheSet(cacheKey, JSON.stringify({ count: 1, resetAt: now + windowMs }), Math.ceil(windowMs / 1000));
      return { ok: true, remaining: limit - 1 };
    }
    if (entry.count >= limit) {
      return { ok: false, remaining: 0 };
    }
    entry.count += 1;
    await cacheSet(cacheKey, JSON.stringify(entry), Math.ceil((entry.resetAt - now) / 1000));
    return { ok: true, remaining: limit - entry.count };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}

/** Synchronous in-memory rate limit (legacy; prefer rateLimitAsync in production). */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  if (process.env.REDIS_URL?.trim()) {
    // Sync callers fall back to per-instance memory when Redis configured
    return memoryRateLimit(key, limit, windowMs);
  }
  return memoryRateLimit(key, limit, windowMs);
}

/** Redis-backed rate limit when REDIS_URL is set; in-memory fallback otherwise. */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  if (process.env.REDIS_URL?.trim()) {
    return redisRateLimit(key, limit, windowMs);
  }
  return memoryRateLimit(key, limit, windowMs);
}

export function rateLimitResponse(remaining: number) {
  return {
    headers: {
      "X-RateLimit-Remaining": String(remaining),
    },
  };
}

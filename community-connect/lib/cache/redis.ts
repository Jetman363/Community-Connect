import "server-only";
import { CacheKeys, invalidatePattern, type CacheNamespace } from "./keys";

type CacheEntry = { value: string; expiresAt: number };

const memoryStore = new Map<string, CacheEntry>();

export type CacheBackend = "redis" | "memory" | "none";

let redisClient: import("ioredis").default | null = null;

let backend: CacheBackend = "memory";
let initPromise: Promise<void> | null = null;

async function initRedis(): Promise<void> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    backend = "memory";
    return;
  }
  try {
    const { default: Redis } = await import("ioredis");
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3000,
    });
    await client.connect();
    await client.ping();
    redisClient = client;
    backend = "redis";
  } catch {
    redisClient = null;
    backend = "memory";
  }
}

export async function getCacheBackend(): Promise<CacheBackend> {
  if (!initPromise) initPromise = initRedis();
  await initPromise;
  return backend;
}

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheGet(key: string): Promise<string | null> {
  await getCacheBackend();
  if (redisClient) return redisClient.get(key);
  return memoryGet(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  await getCacheBackend();
  if (redisClient) {
    await redisClient.set(key, value, "EX", ttlSeconds);
    return;
  }
  memorySet(key, value, ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await getCacheBackend();
  if (redisClient) {
    await redisClient.del(key);
    return;
  }
  memoryStore.delete(key);
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await cacheGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}

/** Invalidate all keys matching a namespace prefix (memory only; redis uses SCAN in prod). */
export async function invalidateNamespace(namespace: CacheNamespace): Promise<number> {
  const prefix = invalidatePattern(namespace).replace("*", "");
  await getCacheBackend();
  if (redisClient) {
    // Placeholder: production should use SCAN + DEL; skip heavy ops in stub
    return 0;
  }
  let count = 0;
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
      count++;
    }
  }
  return count;
}

export async function pingCache(): Promise<{ ok: boolean; backend: CacheBackend; latencyMs?: number }> {
  const start = Date.now();
  await getCacheBackend();
  if (redisClient) {
    try {
      await redisClient.ping();
      return { ok: true, backend: "redis", latencyMs: Date.now() - start };
    } catch {
      return { ok: false, backend: "redis" };
    }
  }
  return { ok: true, backend: "memory", latencyMs: Date.now() - start };
}

export { CacheKeys };

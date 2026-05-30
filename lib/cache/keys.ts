/** Centralized cache key prefixes for invalidation. */
export const CacheKeys = {
  feed: (communityId: string, sort: string, page: number) =>
    `feed:${communityId}:${sort}:${page}`,
  search: (query: string, communityId?: string) =>
    `search:${communityId ?? "global"}:${query.toLowerCase().slice(0, 64)}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  rateLimit: (key: string) => `rl:${key}`,
  session: (sessionId: string) => `session:${sessionId}`,
  metrics: "metrics:snapshot",
} as const;

export type CacheNamespace = "feed" | "search" | "user" | "session" | "metrics";

export function invalidatePattern(namespace: CacheNamespace): string {
  return `${namespace}:*`;
}

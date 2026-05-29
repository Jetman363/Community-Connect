export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function encodeCursor(id: string, createdAt: Date): string {
  return Buffer.from(JSON.stringify({ id, t: createdAt.toISOString() })).toString("base64url");
}

export function decodeCursor(cursor: string): { id: string; t: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed.id === "string" && typeof parsed.t === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

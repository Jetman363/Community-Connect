import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { listModerationQueue } from "@/lib/api/services/moderation";

/** Moderation queue stub — full review UI in Phase 4. */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "MODERATOR");
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listModerationQueue());
    return jsonOk({
      items: items.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        reason: r.reason,
        status: r.status,
        reporter: r.reporter.profile?.displayName,
        createdAt: r.createdAt.toISOString(),
      })),
      note: "Review workflow stub — Phase 4 will add actions",
    });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load moderation queue", 500);
  }
}

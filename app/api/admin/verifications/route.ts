import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { canModerate } from "@/lib/permissions/rbac";
import {
  listPendingVerifications,
  reviewVerification,
} from "@/lib/api/services/verification";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canModerate(auth.payload.role)) return jsonError("Forbidden", 403);

  try {
    const items = await withDbTimeout(listPendingVerifications());
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonOk({ items: [] });
    return jsonError("Failed to load verification queue", 500);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canModerate(auth.payload.role)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const item = await withDbTimeout(
      reviewVerification(parsed.data.id, parsed.data.status, parsed.data.adminNotes)
    );
    return jsonOk(item);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to review verification", 500);
  }
}

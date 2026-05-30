import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { appendModerationNote } from "@/lib/api/services/enterprise";
import { moderationNoteSchema } from "@/lib/validations/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.MODERATION_QUEUE,
  });
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = moderationNoteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const updated = await withDbTimeout(appendModerationNote(id, parsed.data.note));
    if (!updated) return jsonError("Not found", 404);
    return jsonOk(updated);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

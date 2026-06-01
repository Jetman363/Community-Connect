import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { acknowledgeAlert, mapAlert, getDefaultCommunityId } from "@/lib/api/services/alerts";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  try {
    const communityId = await withDbTimeout(getDefaultCommunityId(auth.payload.sub));
    if (!communityId) return jsonError("No community context", 400);

    const alert = await withDbTimeout(acknowledgeAlert(id, auth.payload.sub));
    if (!alert) return jsonError("Not found", 404);
    return jsonOk(mapAlert(alert, auth.payload.sub, { acknowledged: true }));
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to acknowledge", 500);
  }
}

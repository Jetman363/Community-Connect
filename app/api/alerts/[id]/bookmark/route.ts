import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import {
  bookmarkAlert,
  unbookmarkAlert,
  getAlertById,
} from "@/lib/api/services/alerts";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  try {
    const communityId = await withDbTimeout(getDefaultCommunityId(auth.payload.sub));
    if (!communityId) return jsonError("No community context", 400);

    await withDbTimeout(bookmarkAlert(id, auth.payload.sub));
    const alert = await getAlertById(id, communityId, auth.payload.sub);
    return jsonOk({ bookmarked: true, alert });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to bookmark", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  try {
    await withDbTimeout(unbookmarkAlert(id, auth.payload.sub));
    return jsonOk({ bookmarked: false });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to remove bookmark", 500);
  }
}

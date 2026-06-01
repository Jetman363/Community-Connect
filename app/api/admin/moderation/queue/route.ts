import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { getModerationQueue } from "@/lib/api/services/enterprise";
import { getMockModerationQueue } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.MODERATION_QUEUE,
  });
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    const queue = await withDbTimeout(getModerationQueue(communityId ?? undefined));
    return jsonOk(queue);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk(getMockModerationQueue());
    }
    return jsonError("Failed", 500);
  }
}

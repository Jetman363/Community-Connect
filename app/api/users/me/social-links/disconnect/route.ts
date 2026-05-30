import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { socialPlatformSchema } from "@/lib/validations";
import { disconnectSocialLink } from "@/lib/api/services/social-links";

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const platformParam = req.nextUrl.searchParams.get("platform");
  const parsed = socialPlatformSchema.safeParse(platformParam);
  if (!parsed.success) return jsonError("Invalid platform", 400);

  try {
    const removed = await withDbTimeout(
      disconnectSocialLink(auth.payload.sub, parsed.data)
    );
    if (!removed) return jsonError("Link not found", 404);
    return jsonOk({ removed: true, platform: parsed.data });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to disconnect", 500);
  }
}

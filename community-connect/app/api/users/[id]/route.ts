import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getUserProfile, getUserActivity } from "@/lib/api/services/users";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  const viewerId = "payload" in auth ? auth.payload.sub : undefined;
  const { id } = await params;

  const section = req.nextUrl.searchParams.get("section");

  try {
    if (section === "activity") {
      const items = await withDbTimeout(getUserActivity(id));
      return jsonOk({ items });
    }

    const profile = await withDbTimeout(getUserProfile(id, viewerId));
    if (!profile) return jsonError("User not found", 404);
    return jsonOk(profile);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load user", 500);
  }
}

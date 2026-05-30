import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { listPublicSocialLinks } from "@/lib/api/services/social-links";

type Params = { params: Promise<{ id: string }> };

/** Public social links for profile display (isPublic only). */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const items = await withDbTimeout(listPublicSocialLinks(id));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load social links", 500);
  }
}

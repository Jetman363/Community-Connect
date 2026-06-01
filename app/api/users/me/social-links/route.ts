import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { patchSocialLinksSchema } from "@/lib/validations";
import {
  listUserSocialLinks,
  patchSocialLinks,
} from "@/lib/api/services/social-links";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listUserSocialLinks(auth.payload.sub));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load social links", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = patchSocialLinksSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const items = await withDbTimeout(
      patchSocialLinks(auth.payload.sub, parsed.data)
    );
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update social links", 500);
  }
}

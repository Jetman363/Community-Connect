import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { connectSocialLinkSchema } from "@/lib/validations";
import { connectSocialLink } from "@/lib/api/services/social-links";

/**
 * Manual connect (Phase 10 demo). OAuth providers are stubbed — see docs/SOCIAL-OAUTH.md.
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "social-connect"), 20, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = connectSocialLinkSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const link = await withDbTimeout(
      connectSocialLink(auth.payload.sub, parsed.data)
    );
    return jsonOk({ link, oauth: "manual" }, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to connect account", 500);
  }
}

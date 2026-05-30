import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getPersonalizationProfile, updateInterests } from "@/lib/api/services/personalization";
import { ONBOARDING_COOKIE, ONBOARDING_MAX_AGE } from "@/lib/auth/onboarding";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const data = await getPersonalizationProfile(auth.payload.sub);
  const res = NextResponse.json(data);
  if (data.source === "db" && data.interests.length > 0) {
    res.cookies.set(ONBOARDING_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONBOARDING_MAX_AGE,
    });
  }
  return res;
}

const patchSchema = z.object({
  interests: z.array(z.string()).min(1).max(20),
});

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const data = await updateInterests(auth.payload.sub, parsed.data.interests);
  return jsonOk(data);
}

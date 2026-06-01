import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { ONBOARDING_COOKIE, ONBOARDING_MAX_AGE } from "@/lib/auth/onboarding";
import { completeOnboarding } from "@/lib/api/services/radius-user";
import { refreshUserAiProfile } from "@/lib/ai/user-profile";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  await completeOnboarding(auth.payload.sub);
  void refreshUserAiProfile(auth.payload.sub);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ONBOARDING_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONBOARDING_MAX_AGE,
  });
  return res;
}

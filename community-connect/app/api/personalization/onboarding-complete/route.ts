import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { ONBOARDING_COOKIE, ONBOARDING_MAX_AGE } from "@/lib/auth/onboarding";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

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

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE, type JwtPayload } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { hasMinRole } from "@/lib/permissions/rbac";

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

export function requireAuth(
  req: NextRequest,
  minRole?: UserRole
): { payload: JwtPayload } | NextResponse {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  if (minRole && !hasMinRole(payload.role, minRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { payload };
}

function sessionMaxAgeSeconds(): number {
  const raw = process.env.SESSION_MAX_AGE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : 604_800;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 604_800;
}

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds(),
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.delete(AUTH_COOKIE);
}

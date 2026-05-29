import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { hasMinRole } from "@/lib/rbac";
import type { JwtPayload } from "@/lib/auth";

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

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.delete(AUTH_COOKIE);
}

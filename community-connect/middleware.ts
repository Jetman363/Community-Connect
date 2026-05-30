import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { verifyTokenEdge } from "@/lib/auth/jwt-edge";
import { adminRoutes, protectedRoutes } from "@/config/routes";
import { hasMinRole } from "@/lib/permissions/rbac";
import { buildSecurityHeaders } from "@/lib/security/headers";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(buildSecurityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) return withSecurityHeaders(NextResponse.next());

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyTokenEdge(token) : null;
  if (!payload) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", pathname);
    if (request.cookies.has(AUTH_COOKIE)) {
      login.searchParams.set("auth", "failed");
    }
    return withSecurityHeaders(NextResponse.redirect(login));
  }

  const isAdminRoute = adminRoutes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAdminRoute) {
    const opsOnly = pathname.startsWith("/admin/ops");
    const allowed = opsOnly
      ? hasMinRole(payload.role, "PUBLIC_SAFETY")
      : hasMinRole(payload.role, "MODERATOR");
    if (!allowed) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard",
    "/feed",
    "/alerts",
    "/events",
    "/marketplace",
    "/admin",
    "/assistant",
    "/map",
    "/profile",
    "/report",
    "/hoa",
    "/services",
    "/messages",
    "/settings",
    "/dashboard/:path*",
    "/feed/:path*",
    "/alerts/:path*",
    "/events/:path*",
    "/marketplace/:path*",
    "/admin/:path*",
    "/assistant/:path*",
    "/map/:path*",
    "/profile/:path*",
    "/report/:path*",
    "/hoa/:path*",
    "/services/:path*",
    "/messages/:path*",
    "/settings/:path*",
  ],
};

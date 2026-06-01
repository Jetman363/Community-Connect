import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { verifyTokenEdge } from "@/lib/auth/jwt-edge";
import { ONBOARDING_COOKIE } from "@/lib/auth/onboarding";
import { adminRoutes, protectedRoutes } from "@/config/routes";
import { hasMinRole } from "@/lib/permissions/rbac";
import { buildSecurityHeaders } from "@/lib/security/headers";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(buildSecurityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

const ONBOARDING_PATH = "/onboarding";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return withSecurityHeaders(NextResponse.next());
  }

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

  const onboarded = request.cookies.get(ONBOARDING_COOKIE)?.value === "1";
  if (!onboarded && pathname !== ONBOARDING_PATH && !pathname.startsWith(`${ONBOARDING_PATH}/`)) {
    const onboarding = new URL(ONBOARDING_PATH, request.url);
    onboarding.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(onboarding));
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
    "/discover",
    "/search",
    "/alerts",
    "/events",
    "/marketplace",
    "/groups",
    "/admin",
    "/assistant",
    "/map",
    "/profile",
    "/report",
    "/hoa",
    "/services",
    "/messages",
    "/settings",
    "/onboarding",
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/feed/:path*",
    "/discover/:path*",
    "/search/:path*",
    "/alerts/:path*",
    "/events/:path*",
    "/marketplace/:path*",
    "/groups/:path*",
    "/admin/:path*",
    "/admin/launch",
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

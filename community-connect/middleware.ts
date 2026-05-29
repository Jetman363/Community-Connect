import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

const protectedPaths = [
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
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token || !verifyToken(token)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin")) {
    const payload = verifyToken(token)!;
    if (payload.role !== "ADMIN" && payload.role !== "MODERATOR") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
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
  ],
};

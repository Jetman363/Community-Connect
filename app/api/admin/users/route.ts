import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { mockAdminUsers } from "@/lib/mock-data/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.USERS_MANAGE_ROLES,
  });
  if (!("payload" in auth)) return auth;

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 25), 50);

  try {
    const users = await withDbTimeout(
      prisma.user.findMany({
        where: q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { profile: { displayName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : undefined,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          verified: true,
          profile: { select: { displayName: true } },
        },
      })
    );

    return jsonOk({
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        verified: u.verified,
        status: "active",
        name: u.profile?.displayName ?? u.email.split("@")[0],
      })),
    });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const filtered = mockAdminUsers.filter(
        (u) =>
          !q ||
          u.email.toLowerCase().includes(q.toLowerCase()) ||
          u.name.toLowerCase().includes(q.toLowerCase())
      );
      return jsonOk({ items: filtered.slice(0, limit), source: "mock" });
    }
    return jsonError("Failed to load users", 500);
  }
}

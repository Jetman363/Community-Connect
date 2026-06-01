import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { memberRolePatchSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { isSuperAdmin } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.USERS_MANAGE_ROLES,
  });
  if (!("payload" in auth)) return auth;

  const { id } = await context.params;

  try {
    const user = await withDbTimeout(
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          roleAssignments: {
            select: { id: true, role: true, communityId: true, organizationId: true },
          },
        },
      })
    );
    if (!user) return jsonError("User not found", 404);
    return jsonOk(user);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.USERS_MANAGE_ROLES,
  });
  if (!("payload" in auth)) return auth;

  const { id } = await context.params;
  const body = await req.json();
  const parsed = memberRolePatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  if (
    parsed.data.role === "SUPER_ADMIN" &&
    !isSuperAdmin(auth.payload.role)
  ) {
    return jsonError("Only SUPER_ADMIN can assign SUPER_ADMIN", 403);
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });
    if (!existing) return jsonError("User not found", 404);

    if (
      isSuperAdmin(existing.role) &&
      !isSuperAdmin(auth.payload.role)
    ) {
      return jsonError("Cannot modify SUPER_ADMIN without SUPER_ADMIN role", 403);
    }

    const updated = await withDbTimeout(
      prisma.user.update({
        where: { id },
        data: { role: parsed.data.role },
        select: { id: true, email: true, role: true },
      })
    );

    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "user.role.update",
      resource: "user",
      resourceId: id,
      metadata: { from: existing.role, to: parsed.data.role },
    });

    return jsonOk(updated);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update role", 500);
  }
}

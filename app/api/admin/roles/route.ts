import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { roleAssignmentSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return jsonOk({
    roles: Object.keys(ROLE_PERMISSIONS),
    note: "SUPER_ADMIN bypasses all permission checks globally",
  });
}

export async function POST(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.USERS_MANAGE_ROLES,
  });
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = roleAssignmentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const existing = await prisma.userRoleAssignment.findFirst({
      where: {
        userId: parsed.data.userId,
        role: parsed.data.role,
        communityId: parsed.data.communityId ?? null,
        organizationId: parsed.data.organizationId ?? null,
      },
    });

    const assignment = await withDbTimeout(
      existing
        ? prisma.userRoleAssignment.update({
            where: { id: existing.id },
            data: { role: parsed.data.role },
          })
        : prisma.userRoleAssignment.create({
            data: {
              userId: parsed.data.userId,
              role: parsed.data.role,
              communityId: parsed.data.communityId,
              organizationId: parsed.data.organizationId,
              grantedById: auth.payload.sub,
            },
          })
    );

    if (parsed.data.communityId) {
      await prisma.communityMember.upsert({
        where: {
          communityId_userId: {
            communityId: parsed.data.communityId,
            userId: parsed.data.userId,
          },
        },
        update: { role: parsed.data.role },
        create: {
          communityId: parsed.data.communityId,
          userId: parsed.data.userId,
          role: parsed.data.role,
        },
      });
    }

    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "role.assign",
      resource: "user_role_assignment",
      resourceId: assignment.id,
      communityId: parsed.data.communityId,
      organizationId: parsed.data.organizationId,
      metadata: parsed.data,
    });

    return jsonOk(assignment, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

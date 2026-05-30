import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth";
import { hasMinRole, isSuperAdmin } from "./rbac";
import { PERMISSIONS, ROLE_PERMISSIONS, type PermissionKey } from "./permissions";

export interface PermissionContext {
  communityId?: string | null;
  organizationId?: string | null;
}

export function permissionFromRole(role: UserRole, permission: PermissionKey): boolean {
  if (isSuperAdmin(role)) return true;
  const list = ROLE_PERMISSIONS[role] ?? [];
  return list.includes(permission);
}

export async function getEffectivePermissions(
  userId: string,
  communityId?: string | null
): Promise<Set<PermissionKey>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const perms = new Set<PermissionKey>();
  if (!user) return perms;

  if (isSuperAdmin(user.role)) {
    return new Set(Object.values(PERMISSIONS));
  }

  for (const p of ROLE_PERMISSIONS[user.role] ?? []) {
    perms.add(p);
  }

  const assignments = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      OR: [
        { communityId: communityId ?? undefined },
        { communityId: null, organizationId: null },
      ],
    },
    select: { role: true },
  });

  for (const a of assignments) {
    for (const p of ROLE_PERMISSIONS[a.role] ?? []) {
      perms.add(p);
    }
  }

  const communityMember = communityId
    ? await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId } },
        select: { role: true },
      })
    : null;

  if (communityMember) {
    for (const p of ROLE_PERMISSIONS[communityMember.role] ?? []) {
      perms.add(p);
    }
  }

  const now = new Date();
  const temp = await prisma.temporaryPermission.findMany({
    where: {
      userId,
      expiresAt: { gt: now },
      OR: [{ communityId: communityId ?? null }, { communityId: null }],
    },
    include: { permission: true },
  });

  for (const t of temp) {
    perms.add(t.permission.key as PermissionKey);
  }

  const dbRolePerms = await prisma.rolePermission.findMany({
    where: {
      role: {
        in: [
          user.role,
          ...assignments.map((a) => a.role),
          ...(communityMember ? [communityMember.role] : []),
        ],
      },
    },
    include: { permission: true },
  });

  for (const rp of dbRolePerms) {
    perms.add(rp.permission.key as PermissionKey);
  }

  return perms;
}

export async function checkPermission(
  user: JwtPayload | { sub: string; role: UserRole },
  permission: PermissionKey,
  ctx: PermissionContext = {}
): Promise<boolean> {
  if (isSuperAdmin(user.role)) return true;
  if (permissionFromRole(user.role, permission)) return true;

  const effective = await getEffectivePermissions(user.sub, ctx.communityId);
  return effective.has(permission);
}

export function checkPermissionSync(
  role: UserRole,
  permission: PermissionKey,
  communityRole?: UserRole
): boolean {
  if (isSuperAdmin(role)) return true;
  if (permissionFromRole(role, permission)) return true;
  if (communityRole && permissionFromRole(communityRole, permission)) return true;
  return false;
}

/** Minimum role OR explicit permission. */
export async function authorize(
  user: JwtPayload,
  opts: { minRole?: UserRole; permission?: PermissionKey; communityId?: string | null }
): Promise<boolean> {
  if (isSuperAdmin(user.role)) return true;
  if (opts.minRole && hasMinRole(user.role, opts.minRole)) return true;
  if (opts.permission) {
    return checkPermission(user, opts.permission, { communityId: opts.communityId });
  }
  return false;
}

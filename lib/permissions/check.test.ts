import { describe, it, expect } from "vitest";
import { checkPermissionSync } from "@/lib/permissions/check";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions/permissions";
import { canManageAdminSettings } from "@/lib/permissions/rbac";

describe("checkPermissionSync", () => {
  it("grants super admin all permissions", () => {
    expect(checkPermissionSync("SUPER_ADMIN", PERMISSIONS.ADMIN_SYSTEM)).toBe(true);
  });

  it("denies resident admin system access", () => {
    expect(checkPermissionSync("RESIDENT", PERMISSIONS.ADMIN_SYSTEM)).toBe(false);
  });

  it("grants moderator moderation queue permissions", () => {
    expect(checkPermissionSync("MODERATOR", PERMISSIONS.MODERATION_QUEUE)).toBe(true);
  });

  it("grants admin role management permission", () => {
    expect(checkPermissionSync("ADMIN", PERMISSIONS.USERS_MANAGE_ROLES)).toBe(true);
  });
});

describe("canManageAdminSettings", () => {
  it("allows ADMIN and SUPER_ADMIN", () => {
    expect(canManageAdminSettings("ADMIN")).toBe(true);
    expect(canManageAdminSettings("SUPER_ADMIN")).toBe(true);
  });

  it("denies MODERATOR and RESIDENT", () => {
    expect(canManageAdminSettings("MODERATOR")).toBe(false);
    expect(canManageAdminSettings("RESIDENT")).toBe(false);
  });
});

describe("ROLE_PERMISSIONS matrix", () => {
  it("includes platform admin permissions for ADMIN role", () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.ADMIN_SYSTEM);
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.USERS_MANAGE_ROLES);
  });
});

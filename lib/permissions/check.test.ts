import { describe, it, expect } from "vitest";
import { checkPermissionSync } from "@/lib/permissions/check";
import { PERMISSIONS } from "@/lib/permissions/permissions";

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
});

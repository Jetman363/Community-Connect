import type { TenantScope } from "./types";

export function assertTenantScope(
  resource: { organizationId?: string | null; communityId?: string | null },
  scope: TenantScope
): boolean {
  if (scope.organizationId != null && resource.organizationId !== scope.organizationId) {
    return false;
  }
  if (scope.communityId != null && resource.communityId !== scope.communityId) {
    return false;
  }
  return true;
}

export function tenantWhere(scope: TenantScope) {
  const where: Record<string, string | null> = {};
  if (scope.organizationId != null) where.organizationId = scope.organizationId;
  if (scope.communityId != null) where.communityId = scope.communityId;
  return where;
}

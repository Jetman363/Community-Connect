"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import type { UserRole } from "@prisma/client";
import { Search, Shield } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
}

interface RolesResponse {
  roles: string[];
  permissions: string[];
  matrix: Record<string, string[]>;
}

const ASSIGNABLE_ROLES: UserRole[] = [
  "RESIDENT",
  "VERIFIED_USER",
  "BUSINESS_OWNER",
  "MODERATOR",
  "COMMUNITY_MODERATOR",
  "HOA_MANAGER",
  "PUBLIC_SAFETY",
  "DISPATCHER",
  "SUPERVISOR",
  "ADMIN",
  "ENTERPRISE_CLIENT",
];

export default function AdminPrivilegesPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rolesData, setRolesData] = useState<RolesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    const data = await apiFetch<RolesResponse>("/api/admin/roles");
    setRolesData(data);
    setSelectedRole((prev) => prev ?? data.roles[0] ?? null);
  }, []);

  const loadUsers = useCallback(async (q: string) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const data = await apiFetch<{ items: AdminUser[] }>(`/api/admin/users${params}`);
    setUsers(data.items);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await Promise.all([loadRoles(), loadUsers("")]);
      } catch {
        toast("Unable to load privileges data — admin access required", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadRoles, loadUsers, toast]);

  const matrixRole = selectedRole ?? rolesData?.roles[0] ?? "";
  const rolePermissions = useMemo(
    () => rolesData?.matrix[matrixRole] ?? [],
    [matrixRole, rolesData?.matrix]
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    try {
      await loadUsers(query);
    } catch {
      toast("User search failed", "error");
    }
  }

  async function updateUserRole(userId: string, role: UserRole) {
    setSavingId(userId);
    try {
      await apiFetch(`/api/admin/users/${userId}/roles`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast("Role updated", "success");
    } catch {
      toast("Failed to update role", "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Privileges & Roles"
        description="View RBAC matrix and assign platform roles to users"
        action={
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              Admin Settings
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" /> Assign roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            {loading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Loading users…</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <UserRoleRow
                        key={user.id}
                        user={user}
                        saving={savingId === user.id}
                        onSave={updateUserRole}
                      />
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="p-4 text-sm text-[var(--muted-foreground)]">No users found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" /> Permission matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(rolesData?.roles ?? []).map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={matrixRole === role ? "default" : "outline"}
                  onClick={() => setSelectedRole(role)}
                >
                  {role.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {matrixRole === "SUPER_ADMIN"
                ? "SUPER_ADMIN bypasses all permission checks globally."
                : `${rolePermissions.length} permissions for ${matrixRole}`}
            </p>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] p-3">
              <ul className="space-y-1 text-xs font-mono">
                {(matrixRole === "SUPER_ADMIN"
                  ? rolesData?.permissions ?? []
                  : rolePermissions
                ).map((perm) => (
                  <li key={perm} className="flex items-center gap-2">
                    <Badge variant="accent" className="font-mono text-[10px]">
                      {perm}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

function UserRoleRow({
  user,
  saving,
  onSave,
}: {
  user: AdminUser;
  saving: boolean;
  onSave: (userId: string, role: UserRole) => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);

  useEffect(() => {
    setRole(user.role);
  }, [user.role]);

  return (
    <tr className="border-b border-[var(--border)]">
      <td className="px-3 py-2">
        <p className="font-medium">{user.name}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
      </td>
      <td className="px-3 py-2">
        <select
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
          {user.role === "SUPER_ADMIN" && (
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
          )}
        </select>
      </td>
      <td className="px-3 py-2">
        <Button
          size="sm"
          disabled={saving || role === user.role}
          onClick={() => void onSave(user.id, role)}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </td>
    </tr>
  );
}

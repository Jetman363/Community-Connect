"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/admin-api";
import { ApiError, registerUser } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { ADMIN_ROLES, ROLE_LABELS, canManageUsers } from "@/lib/rbac";
import { CURRENT_OFFICER } from "@/lib/mock-data";
import { Plus, RefreshCw, Trash2, KeyRound } from "lucide-react";

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = err.detail;
    if (typeof detail === "object" && detail !== null && "detail" in detail) {
      const d = (detail as { detail: unknown }).detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d)) return d.map((x) => JSON.stringify(x)).join("; ");
    }
    if (typeof detail === "string") return detail;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export default function AdminUsersPage() {
  const { token, roles, authMode, officer } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "viewer",
  });

  const load = useCallback(async () => {
    if (!token && authMode === "demo") {
      setUsers([
        {
          id: "demo-1",
          agency_id: officer?.agencyId ?? CURRENT_OFFICER.agencyId,
          username: "admin@sapd.gov",
          first_name: "System",
          last_name: "Admin",
          role: "admin",
          rank: "Captain",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setUsers(await adminApi.listUsers(token));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [token, authMode, officer?.agencyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setFormError(null);

    if (!form.username.trim()) {
      setFormError("Username is required.");
      return;
    }
    if (form.password.length < 12) {
      setFormError("Password must be at least 12 characters.");
      return;
    }

    const agencyId = officer?.agencyId ?? CURRENT_OFFICER.agencyId;
    const payload = {
      agency_id: agencyId,
      username: form.username.trim(),
      password: form.password,
      first_name: form.first_name.trim() || undefined,
      last_name: form.last_name.trim() || undefined,
      role: form.role,
    };

    setSubmitting(true);
    try {
      if (token && canManageUsers(roles)) {
        // Admin API — full user management + audit log
        await adminApi.createUser(token, payload);
      } else {
        // Public register — writes to auth DB without admin JWT (for testing)
        const created = (await registerUser(payload)) as AdminUser;
        setUsers((prev) => [created, ...prev.filter((u) => u.username !== created.username)]);
        setShowForm(false);
        setForm({ username: "", password: "", first_name: "", last_name: "", role: "viewer" });
        setFormError(null);
        setSubmitting(false);
        return;
      }
      setShowForm(false);
      setForm({ username: "", password: "", first_name: "", last_name: "", role: "viewer" });
      await load();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: AdminUser) => {
    if (!token) return;
    try {
      await adminApi.updateUser(token, user.id, { is_active: !user.is_active });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const changeRole = async (user: AdminUser, role: string) => {
    if (!token) return;
    try {
      await adminApi.updateUser(token, user.id, { role });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token || !confirm("Delete this user?")) return;
    try {
      await adminApi.deleteUser(token, userId);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const handleReset = async (userId: string) => {
    if (!token) return;
    const pwd = prompt("Enter new password (min 12 chars):");
    if (!pwd || pwd.length < 12) return;
    try {
      await adminApi.resetPassword(token, userId, pwd);
      alert("Password reset");
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const canWrite = canManageUsers(roles) || authMode === "demo" || !token;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">User Management</h2>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {canWrite && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add User
            </button>
          )}
        </div>
      </div>

      {authMode === "demo" && !token && (
        <div className="text-sm text-cyan-400/90 bg-cyan-500/10 border border-cyan-500/20 rounded px-3 py-2">
          Demo mode — Create User writes to the real auth database via register API. Log in as admin for full user management.
        </div>
      )}

      {error && <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">{error}</div>}

      {showForm && canWrite && (
        <div className="panel p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {(["username", "password", "first_name", "last_name"] as const).map((field) => (
            <input
              key={field}
              className="input-field text-sm"
              placeholder={field.replace("_", " ")}
              type={field === "password" ? "password" : "text"}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          ))}
          <select className="input-field text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {formError && (
            <div className="md:col-span-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {formError}
            </div>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="btn-primary text-sm md:col-span-2 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create User"}
          </button>
        </div>
      )}

      <div className="panel overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-mono text-xs text-cyan-400">{u.username}</td>
                <td className="text-sm text-slate-300">{u.first_name} {u.last_name}</td>
                <td>
                  {canWrite && token ? (
                    <select
                      className="input-field text-xs py-1"
                      value={u.role ?? "viewer"}
                      onChange={(e) => changeRole(u, e.target.value)}
                    >
                      {ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="badge text-slate-400">{u.role}</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    disabled={!canWrite || !token}
                    className={`text-xs ${u.is_active ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {u.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="flex gap-2">
                  {canWrite && token && (
                    <>
                      <button type="button" onClick={() => handleReset(u.id)} className="text-slate-500 hover:text-cyan-400" aria-label="Reset password">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(u.id)} className="text-slate-500 hover:text-red-400" aria-label="Delete user">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <p className="p-6 text-center text-sm text-slate-500">No users found</p>
        )}
      </div>
    </div>
  );
}

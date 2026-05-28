"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { OperationsThemeToggle } from "@/components/shared/OperationsThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { ALL_UNIT_NUMBERS, SERVICE_AREAS, type ServiceArea } from "@/lib/officer-roster";
import { getRosterForRole, type ProgramLoginInput } from "@/lib/program-rosters";
import type { UserRole } from "@/lib/types";

export interface ProgramLoginConfig {
  role: UserRole;
  title: string;
  subtitle: string;
  redirectPath: string;
  homeHref?: string;
  icon: LucideIcon;
  submitLabel: string;
  demoHint?: string;
  showUnitField?: boolean;
  /** Defaults to true; calltaker (911 intake) does not use service area */
  requireServiceArea?: boolean;
}

interface Props {
  config: ProgramLoginConfig;
}

export function ProgramLoginForm({ config }: Props) {
  const router = useRouter();
  const { loginProgram, user } = useAuth();
  const roster = useMemo(() => getRosterForRole(config.role), [config.role]);
  const [userId, setUserId] = useState(roster[0]?.id ?? "");
  const [serviceArea, setServiceArea] = useState<ServiceArea>(roster[0]?.defaultServiceArea ?? "Central");
  const [unitCallSign, setUnitCallSign] = useState(roster[0]?.primaryUnit ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldsReady, setFieldsReady] = useState(false);

  const selected = useMemo(() => roster.find((u) => u.id === userId), [roster, userId]);
  const unitOptions = useMemo(() => {
    if (selected?.allowedUnits?.length) return selected.allowedUnits;
    return ALL_UNIT_NUMBERS;
  }, [selected]);

  const requireServiceArea = config.requireServiceArea !== false;

  useEffect(() => {
    const signedIn =
      user?.role === config.role &&
      (requireServiceArea ? !!user.serviceArea : true);
    if (signedIn) {
      router.replace(config.redirectPath);
    }
  }, [user, config.role, config.redirectPath, requireServiceArea, router]);

  useEffect(() => {
    if (!selected) return;
    if (requireServiceArea) {
      setServiceArea(selected.defaultServiceArea);
    }
    setPassword(selected.password);
    if (config.showUnitField && selected.primaryUnit) {
      setUnitCallSign(selected.primaryUnit);
    }
    setFieldsReady(true);
  }, [userId, selected, config.showUnitField, requireServiceArea]);

  useEffect(() => {
    if (fieldsReady || !roster[0]) return;
    setPassword(roster[0].password);
    setFieldsReady(true);
  }, [fieldsReady, roster]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input: ProgramLoginInput = {
      role: config.role,
      userId,
      password,
      unitCallSign: config.showUnitField ? unitCallSign : undefined,
      ...(requireServiceArea ? { serviceArea } : {}),
    };

    const err = loginProgram(input);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.push(config.redirectPath);
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex flex-col pt-8">
      <header className="border-b border-[#2a2a32] px-6 py-4 flex items-center gap-4">
        <Link href={config.homeHref ?? "/"} className="text-slate-500 hover:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Icon className="w-7 h-7 text-blue-500" />
        <div>
          <h1 className="text-lg font-bold text-slate-100">{config.title}</h1>
          <p className="text-xs text-slate-500">{config.subtitle}</p>
        </div>
        <div className="ml-auto">
          <OperationsThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="tactical-panel w-full max-w-md p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-200">Secure Sign-In</h2>
          </div>

          <Field label="User Name">
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className={fieldClass} required>
              {roster.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · Badge #{u.badge}
                </option>
              ))}
            </select>
          </Field>

          {config.showUnitField && (
            <Field label="Unit Number">
              <select
                value={unitCallSign}
                onChange={(e) => setUnitCallSign(e.target.value)}
                className={fieldClass}
                required
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
          )}

          {requireServiceArea && (
            <Field label="Service Area">
              <select
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value as ServiceArea)}
                className={fieldClass}
                required
              >
                {SERVICE_AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={fieldClass}
              required
            />
          </Field>

          {error && (
            <p className="text-xs text-red-400 bg-red-600/10 border border-red-500/30 rounded p-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !roster.length}
            className={clsx(
              "w-full tactical-btn bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2",
              submitting && "opacity-60 cursor-not-allowed",
            )}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
            ) : (
              config.submitLabel
            )}
          </button>

          {config.demoHint && (
            <p className="text-[10px] text-slate-600 text-center leading-relaxed">{config.demoHint}</p>
          )}
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const fieldClass =
  "w-full bg-[#1a1a20] border border-[#2a2a32] rounded px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500";

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: string | number;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  subtitle,
  defaultOpen = true,
  badge,
  children,
  className,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "border border-slate-700/60 rounded-lg bg-[#111827]/80 overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-800/40 hover:bg-slate-800/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-cyan-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {badge !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="p-4 border-t border-slate-700/40">{children}</div>}
    </section>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-amber-400 ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-amber-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed";

export const selectClass = inputClass;

export const textareaClass = cn(inputClass, "min-h-[80px] resize-y");

interface DynamicEntryCardProps {
  title: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  children: ReactNode;
}

export function DynamicEntryCard({ title, index, onRemove, canRemove, children }: DynamicEntryCardProps) {
  return (
    <div className="border border-slate-700/50 rounded-md p-4 space-y-4 bg-slate-900/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {title} #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            Remove Entry
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function YesNoSelect({
  value,
  onChange,
  disabled,
}: {
  value?: boolean;
  onChange: (v: boolean | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className={selectClass}
      value={value === undefined ? "" : value ? "yes" : "no"}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : v === "yes");
      }}
      disabled={disabled}
    >
      <option value="">— Select —</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

export function CjiBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
      CJI Protected
    </span>
  );
}

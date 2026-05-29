"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-none", className)}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            value === opt.id
              ? "bg-[var(--foreground)] text-[var(--background)]"
              : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function FilterChipsAnimated<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
        >
          {value === opt.id && (
            <motion.div
              layoutId="filter-chip"
              className="absolute inset-0 rounded-full bg-[var(--foreground)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={cn(
              "relative z-10",
              value === opt.id ? "text-[var(--background)]" : "text-[var(--muted-foreground)]"
            )}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

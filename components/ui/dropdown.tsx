"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-xl transition-colors hover:bg-[var(--muted)]"
        aria-expanded={open}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg",
              align === "end" ? "right-0" : "left-0"
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  href,
  destructive,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const cls = cn(
    "flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--muted)]",
    destructive ? "text-[var(--emergency)]" : "text-[var(--foreground)]"
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">{children}</div>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[var(--border)]" />;
}

export function DropdownChevron() {
  return <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />;
}

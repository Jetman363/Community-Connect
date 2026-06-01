"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MockAlert } from "@/lib/mock-data/alerts";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { formatRelative } from "@/lib/utils";

const severityStyles = {
  INFO: { badge: "default" as const, border: "border-l-zinc-400" },
  ADVISORY: { badge: "accent" as const, border: "border-l-blue-500" },
  WARNING: { badge: "accent" as const, border: "border-l-amber-500" },
  EMERGENCY: { badge: "emergency" as const, border: "border-l-[var(--emergency)]" },
};

export function AlertCard({
  alert,
  compact,
  onClick,
}: {
  alert: MockAlert;
  compact?: boolean;
  onClick?: () => void;
}) {
  const style = severityStyles[alert.severity];

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border border-[var(--border)] border-l-4 bg-[var(--card)] p-4 shadow-sm transition-shadow hover:shadow-md",
        style.border,
        compact && "p-3"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={style.badge}>{alert.severity}</Badge>
            <span className="text-xs capitalize text-[var(--muted-foreground)]">
              {alert.category.replace("-", " ")}
            </span>
          </div>
          <h3 className={cn("mt-2 font-semibold", compact ? "text-sm" : "text-base")}>
            {alert.title}
          </h3>
          {!compact && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
              {alert.description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {alert.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelative(alert.createdAt)}
        </span>
        <span>{alert.source}</span>
      </div>
    </motion.article>
  );
}

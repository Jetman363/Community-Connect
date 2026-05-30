"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SafetyAlertDto } from "@/types/safety";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Bookmark, CheckCircle2, Share2 } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { markerColorForSeverity } from "@/lib/maps/markers";

const severityStyles: Record<
  string,
  { badge: "default" | "accent" | "emergency"; border: string }
> = {
  INFO: { badge: "default", border: "border-l-zinc-400" },
  LOW: { badge: "accent", border: "border-l-blue-500" },
  MODERATE: { badge: "accent", border: "border-l-amber-500" },
  HIGH: { badge: "emergency", border: "border-l-orange-500" },
  CRITICAL: { badge: "emergency", border: "border-l-[var(--emergency)]" },
};

export function AlertCard({
  alert,
  compact,
  onClick,
  onAcknowledge,
  onBookmark,
}: {
  alert: SafetyAlertDto;
  compact?: boolean;
  onClick?: () => void;
  onAcknowledge?: (e: React.MouseEvent) => void;
  onBookmark?: (e: React.MouseEvent) => void;
}) {
  const style = severityStyles[alert.severity] ?? severityStyles.INFO;
  const location = alert.locationLabel ?? (alert.lat != null ? "Mapped location" : "Area-wide");

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
      style={{ borderLeftColor: markerColorForSeverity(alert.severity) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={style.badge}>{alert.severity}</Badge>
            <span className="text-xs capitalize text-[var(--muted-foreground)]">
              {alert.category.toLowerCase().replace("_", " ")}
            </span>
            {alert.active && <Badge variant="success">Active</Badge>}
            {alert.acknowledged && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Ack
              </span>
            )}
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
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          {onBookmark && (
            <button
              type="button"
              onClick={onBookmark}
              className="rounded-lg p-1.5 hover:bg-[var(--muted)]"
              aria-label="Bookmark"
            >
              <Bookmark
                className={cn("h-4 w-4", alert.bookmarked && "fill-current text-[var(--accent)]")}
              />
            </button>
          )}
          {onAcknowledge && !alert.acknowledged && (
            <button
              type="button"
              onClick={onAcknowledge}
              className="rounded-lg p-1.5 hover:bg-[var(--muted)]"
              aria-label="Acknowledge"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                void navigator.share({ title: alert.title, text: alert.description, url: `/alerts?id=${alert.id}` });
              }
            }}
            className="rounded-lg p-1.5 hover:bg-[var(--muted)]"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelative(alert.createdAt)}
        </span>
        {alert.source && <span>{alert.source}</span>}
      </div>
    </motion.article>
  );
}

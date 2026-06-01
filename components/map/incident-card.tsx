"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MapMarkerDto, SafetyAlertDto } from "@/types/safety";
import { markerColorForSeverity } from "@/lib/maps/markers";
import { MapPin, X } from "lucide-react";

export function IncidentCard({
  marker,
  alert,
  onClose,
  onAcknowledge,
}: {
  marker?: MapMarkerDto;
  alert?: SafetyAlertDto;
  onClose: () => void;
  onAcknowledge?: () => void;
}) {
  const title = alert?.title ?? marker?.title ?? "Details";
  const severity = alert?.severity ?? marker?.severity;
  const color = severity ? markerColorForSeverity(severity) : undefined;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg sm:left-auto sm:right-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {severity && (
            <Badge
              variant={severity === "CRITICAL" || severity === "HIGH" ? "emergency" : "accent"}
              style={color ? { borderColor: color } : undefined}
            >
              {severity}
            </Badge>
          )}
          <h3 className="mt-2 font-semibold text-sm">{title}</h3>
          {alert?.description && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
              {alert.description}
            </p>
          )}
          {(alert?.locationLabel || marker) && (
            <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <MapPin className="h-3 w-3" />
              {alert?.locationLabel ?? `${marker?.lat.toFixed(4)}, ${marker?.lng.toFixed(4)}`}
            </p>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>
      {alert && !alert.acknowledged && onAcknowledge && (
        <Button size="sm" className="mt-3 w-full" onClick={onAcknowledge}>
          Acknowledge alert
        </Button>
      )}
    </div>
  );
}

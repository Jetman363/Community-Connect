import type { AlertSeverity, ReportSeverity } from "@prisma/client";

export const SEVERITY_MARKER_COLORS: Record<string, string> = {
  INFO: "#94a3b8",
  LOW: "#3b82f6",
  MODERATE: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

export function markerColorForSeverity(severity: AlertSeverity | ReportSeverity | string): string {
  return SEVERITY_MARKER_COLORS[severity] ?? SEVERITY_MARKER_COLORS.INFO;
}

export function markerIconPath(type: "alert" | "report" | "event" | "business"): string {
  const paths: Record<string, string> = {
    alert: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z",
    event: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z",
    business: "M12 7V3H2v18h20V7H12z",
  };
  return paths[type] ?? paths.alert;
}

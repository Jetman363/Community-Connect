import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "text-red-400 bg-red-500/15 border-red-500/30";
    case "high":
      return "text-amber-400 bg-amber-500/15 border-amber-500/30";
    case "medium":
      return "text-cyan-400 bg-cyan-500/15 border-cyan-500/30";
    default:
      return "text-slate-400 bg-slate-500/15 border-slate-500/30";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "available":
      return "text-emerald-400";
    case "en_route":
      return "text-amber-400";
    case "on_scene":
      return "text-cyan-400";
    case "busy":
      return "text-orange-400";
    default:
      return "text-slate-500";
  }
}

export function reportStatusColor(status: string): string {
  switch (status) {
    case "draft":
      return "text-slate-400 bg-slate-500/15";
    case "pending_review":
      return "text-amber-400 bg-amber-500/15";
    case "approved":
      return "text-emerald-400 bg-emerald-500/15";
    case "submitted":
      return "text-cyan-400 bg-cyan-500/15";
    default:
      return "text-slate-400 bg-slate-500/15";
  }
}

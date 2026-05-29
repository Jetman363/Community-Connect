import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function MapPlaceholder({
  className,
  label = "Interactive map",
  height = "h-64",
}: {
  className?: string;
  label?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]",
        height,
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--muted)_25%,transparent_25%,transparent_50%,var(--muted)_50%,var(--muted)_75%,transparent_75%)] bg-[length:20px_20px] opacity-30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--card)] shadow-sm">
          <MapPin className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <p className="text-xs text-[var(--muted-foreground)]/70">Map integration in Phase 3</p>
      </div>
      {/* Decorative pins */}
      <div className="absolute left-[30%] top-[35%] h-3 w-3 rounded-full bg-[var(--accent)] shadow-md ring-2 ring-white" />
      <div className="absolute left-[55%] top-[50%] h-3 w-3 rounded-full bg-[var(--emergency)] shadow-md ring-2 ring-white" />
      <div className="absolute left-[70%] top-[30%] h-3 w-3 rounded-full bg-emerald-500 shadow-md ring-2 ring-white" />
    </div>
  );
}

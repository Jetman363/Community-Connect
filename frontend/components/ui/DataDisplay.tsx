import { cn, priorityColor, statusColor, reportStatusColor } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  change,
  trend,
}: {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
}) {
  const changeColor =
    trend === "up" ? "text-red-400" : trend === "down" ? "text-emerald-400" : "text-slate-500";

  return (
    <div className="panel p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-semibold text-white tabular-nums">{value}</div>
      <div className={cn("text-xs mt-1 tabular-nums", changeColor)}>
        {change > 0 ? "+" : ""}
        {change}% vs prior period
      </div>
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={cn("badge", priorityColor(priority))}>{priority.toUpperCase()}</span>;
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn("w-2 h-2 rounded-full bg-current", statusColor(status))} />
      <span className={statusColor(status)}>{status.replace("_", " ")}</span>
    </span>
  );
}

export function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge border-0", reportStatusColor(status))}>
      {status.replace("_", " ")}
    </span>
  );
}

export function MapPlaceholder({ label }: { label?: string }) {
  return (
    <div className="relative w-full h-full min-h-[200px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2 animate-pulse shadow-lg shadow-red-500/50" />
          <div className="text-xs text-slate-500">{label || "GIS Map Layer"}</div>
        </div>
      </div>
      <div className="absolute top-3 left-3 text-[10px] text-slate-600 font-mono">EPSG:4326 · District Overlay</div>
    </div>
  );
}

export function TrendChart() {
  const data = [
    { month: "Jan", violent: 42, property: 89, narcotics: 34 },
    { month: "Feb", violent: 38, property: 92, narcotics: 41 },
    { month: "Mar", violent: 45, property: 78, narcotics: 38 },
    { month: "Apr", violent: 51, property: 85, narcotics: 52 },
    { month: "May", violent: 47, property: 81, narcotics: 48 },
  ];
  const max = Math.max(...data.flatMap((d) => [d.violent, d.property, d.narcotics]));

  return (
    <div className="flex items-end gap-3 h-32 px-2">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 h-24 w-full">
            <div className="flex-1 bg-red-500/60 rounded-t" style={{ height: `${(d.violent / max) * 100}%` }} />
            <div className="flex-1 bg-amber-500/60 rounded-t" style={{ height: `${(d.property / max) * 100}%` }} />
            <div className="flex-1 bg-cyan-500/60 rounded-t" style={{ height: `${(d.narcotics / max) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

export function EntityGraph() {
  const nodes = [
    { id: "n1", label: "M. Webb", x: 50, y: 30, color: "bg-red-500" },
    { id: "n2", label: "F-150", x: 20, y: 60, color: "bg-amber-500" },
    { id: "n3", label: "Oakwood Dr", x: 80, y: 60, color: "bg-cyan-500" },
    { id: "n4", label: "INV-0041", x: 50, y: 85, color: "bg-purple-500" },
  ];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full min-h-[180px]">
      <line x1="50" y1="30" x2="20" y2="60" stroke="#334155" strokeWidth="0.5" />
      <line x1="50" y1="30" x2="80" y2="60" stroke="#334155" strokeWidth="0.5" />
      <line x1="50" y1="30" x2="50" y2="85" stroke="#334155" strokeWidth="0.5" />
      <line x1="20" y1="60" x2="80" y2="60" stroke="#334155" strokeWidth="0.3" strokeDasharray="2" />
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r="4" className="fill-cyan-500/80" />
          <text x={n.x} y={n.y + 8} textAnchor="middle" className="fill-slate-400 text-[4px]">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

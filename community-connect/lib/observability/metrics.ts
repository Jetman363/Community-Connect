import "server-only";

const counters = new Map<string, number>();
const startTime = Date.now();

export function incrementCounter(name: string, delta = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + delta);
}

export function getCounter(name: string): number {
  return counters.get(name) ?? 0;
}

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - startTime) / 1000);
}

export function snapshotMetrics(): Record<string, number | string> {
  const out: Record<string, number | string> = {
    uptime_seconds: getUptimeSeconds(),
  };
  for (const [k, v] of counters) {
    out[k] = v;
  }
  return out;
}

/** Prometheus text exposition format (subset). */
export function formatPrometheus(): string {
  const lines: string[] = [];
  lines.push(`# HELP cc_uptime_seconds Process uptime`);
  lines.push(`# TYPE cc_uptime_seconds gauge`);
  lines.push(`cc_uptime_seconds ${getUptimeSeconds()}`);
  for (const [name, value] of counters) {
    const safe = name.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`# TYPE cc_${safe}_total counter`);
    lines.push(`cc_${safe}_total ${value}`);
  }
  return lines.join("\n") + "\n";
}

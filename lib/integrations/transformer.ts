import type { IntegrationEvent } from "./types";

export interface FieldMapping {
  source: string;
  target: string;
  transform?: "lowercase" | "uppercase" | "trim" | "number";
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function applyTransform(value: unknown, transform?: FieldMapping["transform"]): unknown {
  if (value == null || !transform) return value;
  const s = String(value);
  switch (transform) {
    case "lowercase":
      return s.toLowerCase();
    case "uppercase":
      return s.toUpperCase();
    case "trim":
      return s.trim();
    case "number":
      return Number(value);
    default:
      return value;
  }
}

export function mapFields(
  source: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const m of mappings) {
    const raw = getNestedValue(source, m.source);
    if (raw !== undefined) {
      setNestedValue(out, m.target, applyTransform(raw, m.transform));
    }
  }
  return out;
}

export function normalizeEvent(
  raw: Record<string, unknown>,
  opts: {
    type: string;
    source: string;
    connectorSlug: string;
    mappings?: FieldMapping[];
    organizationId?: string | null;
    communityId?: string | null;
  }
): IntegrationEvent {
  const payload = opts.mappings ? mapFields(raw, opts.mappings) : raw;
  return {
    id: crypto.randomUUID(),
    type: opts.type,
    source: opts.source,
    connectorSlug: opts.connectorSlug,
    organizationId: opts.organizationId,
    communityId: opts.communityId,
    payload,
    timestamp: new Date(),
  };
}

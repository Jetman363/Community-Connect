"use client";

import { FilterChips } from "@/components/ui/filter-chips";

const LAYERS = [
  { id: "all", label: "All" },
  { id: "alerts,reports", label: "Safety" },
  { id: "alerts", label: "Alerts" },
  { id: "reports", label: "Reports" },
  { id: "events", label: "Events" },
  { id: "businesses", label: "Businesses" },
] as const;

export function LayerControls({
  value,
  onChange,
}: {
  value: string;
  onChange: (layer: string) => void;
}) {
  return (
    <FilterChips
      options={[...LAYERS]}
      value={value}
      onChange={onChange}
      className="mb-3"
    />
  );
}

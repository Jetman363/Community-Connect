"use client";

import { FilterChips } from "@/components/ui/filter-chips";
import { marketplaceQuickCategories } from "@/lib/mock-data/marketplace";

export function CategoryChips({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <FilterChips
      options={marketplaceQuickCategories.map((c) => ({ id: c.id, label: c.label }))}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}

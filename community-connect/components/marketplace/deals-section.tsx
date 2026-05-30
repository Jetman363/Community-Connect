"use client";

import Link from "next/link";
import { DealCard } from "@/components/deals/deal-card";
import type { DealDto } from "@/types/engagement";
import { Tag } from "lucide-react";

export function DealsSection({ deals }: { deals: DealDto[] }) {
  if (deals.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Tag className="h-5 w-5 text-[var(--accent)]" />
          Community Deals
        </h2>
        <Link href="/deals" className="text-sm text-[var(--accent)] hover:underline">
          All deals →
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {deals.slice(0, 6).map((deal) => (
          <div key={deal.id} className="min-w-[280px] snap-start shrink-0">
            <DealCard deal={deal} />
          </div>
        ))}
      </div>
    </section>
  );
}

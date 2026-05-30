"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { TrendingItemDto } from "@/types/engagement";
import { CommunityImage } from "@/components/ui/community-image";

export function TrendingStrip({ items }: { items: TrendingItemDto[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex min-w-[200px] shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
            {i + 1}
          </span>
          {item.imageUrl && (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <CommunityImage src={item.imageUrl} alt="" fill sizes="40px" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title ?? item.entityType}</p>
            <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <TrendingUp className="h-3 w-3" />
              {Math.round(item.score)}
            </p>
          </div>
        </motion.div>
      ))}
      <Link
        href="/discover"
        className="flex min-w-[120px] shrink-0 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        See all
      </Link>
    </div>
  );
}

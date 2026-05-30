"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import type { LifestyleRecommendation } from "@/types/engagement";
import { Sparkles } from "lucide-react";

export function RecommendationCard({ item }: { item: LifestyleRecommendation }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="min-w-[260px] shrink-0 snap-start">
      <Link
        href={item.href ?? "#"}
        className="block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md"
      >
        {item.imageUrl && (
          <div className="relative h-32">
            <CommunityImage src={item.imageUrl} alt={item.title} fill sizes="260px" />
          </div>
        )}
        <div className="p-4">
          <div className="mb-1 flex items-center gap-1 text-xs text-[var(--accent)]">
            <Sparkles className="h-3 w-3" />
            {item.category}
          </div>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
            {item.description}
          </p>
          <p className="mt-2 text-xs italic text-[var(--muted-foreground)]">{item.reason}</p>
        </div>
      </Link>
    </motion.div>
  );
}

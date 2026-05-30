"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import type { DiscoverFeedItem } from "@/types/engagement";
import { Bookmark, Share2 } from "lucide-react";

const typeColors: Record<string, string> = {
  post: "bg-blue-500/10 text-blue-600",
  deal: "bg-emerald-500/10 text-emerald-600",
  event: "bg-purple-500/10 text-purple-600",
  group: "bg-orange-500/10 text-orange-600",
  news: "bg-slate-500/10 text-slate-600",
  challenge: "bg-amber-500/10 text-amber-600",
  marketplace: "bg-blue-600/10 text-blue-700",
};

export function DiscoverCard({
  item,
  onSave,
  onShare,
}: {
  item: DiscoverFeedItem;
  onSave?: () => void;
  onShare?: () => void;
}) {
  const content = (
    <motion.article
      whileTap={{ scale: 0.98 }}
      className="relative flex h-[420px] w-[280px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm md:w-[320px]"
    >
      {item.imageUrl && (
        <div className="relative h-48">
          <CommunityImage src={item.imageUrl} alt={item.title} fill sizes="320px" rounded="none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className={`absolute left-3 top-3 ${typeColors[item.type] ?? ""}`}>
            {item.type}
          </Badge>
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{item.title}</h3>
        {item.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{item.subtitle}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          {item.score != null && (
            <span className="text-xs text-[var(--muted-foreground)]">Score {item.score}</span>
          )}
          <div className="flex gap-1">
            {onSave && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSave();
                }}
                className="rounded-lg p-2 hover:bg-[var(--muted)]"
                aria-label="Save"
              >
                <Bookmark className="h-4 w-4" />
              </button>
            )}
            {onShare && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onShare();
                }}
                className="rounded-lg p-2 hover:bg-[var(--muted)]"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }
  return content;
}

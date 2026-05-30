"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { RelativeTime } from "@/components/ui/relative-time";
import type { NewsArticleDto } from "@/types/engagement";

export function NewsCard({ article }: { article: NewsArticleDto }) {
  return (
    <motion.article whileHover={{ y: -2 }}>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {article.imageUrl && (
          <div className="relative h-40">
            <CommunityImage src={article.imageUrl} alt={article.title} fill sizes="400px" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="default">{article.category}</Badge>
            <span className="text-xs text-[var(--muted-foreground)]">{article.source}</span>
          </div>
          <h3 className="mt-2 font-semibold leading-snug">{article.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
            {article.summary}
          </p>
          {article.aiSummary && (
            <div className="mt-3 rounded-xl bg-[var(--accent)]/5 p-3">
              <p className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" /> AI Summary
              </p>
              <p className="mt-1 text-sm">{article.aiSummary}</p>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            <RelativeTime date={article.publishedAt} />
          </p>
        </div>
      </div>
    </motion.article>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { FeedPostCard } from "@/components/cards/feed-post";
import { getMockFeedPosts } from "@/lib/api/fallback";

export function FeedPreview() {
  const posts = getMockFeedPosts().slice(0, 2);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Community Feed</h2>
        <Link
          href="/feed"
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <FeedPostCard post={post} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

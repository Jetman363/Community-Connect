"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Bookmark, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { FeedPost } from "@/types/feed";
import { FeedPostCard } from "@/components/cards/feed-post";

export function SwipeableFeedCard({ post }: { post: FeedPost }) {
  const { toast } = useToast();
  const x = useMotionValue(0);
  const bgSave = useTransform(x, [-120, -40], [1, 0]);
  const bgShare = useTransform(x, [40, 120], [0, 1]);
  const [revealed, setRevealed] = useState<"save" | "share" | null>(null);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80) {
      setRevealed("save");
      toast("Saved (stub)", "success");
    } else if (info.offset.x > 80) {
      setRevealed("share");
      toast("Share link copied (stub)", "success");
      void navigator.clipboard?.writeText(`${window.location.origin}/feed`);
    } else {
      setRevealed(null);
    }
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-emerald-500/20 text-emerald-700"
        style={{ opacity: bgSave }}
      >
        <Bookmark className="h-6 w-6" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-[var(--accent)]/20 text-[var(--accent)]"
        style={{ opacity: bgShare }}
      >
        <Share2 className="h-6 w-6" />
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        style={{ x }}
        onDragEnd={onDragEnd}
      >
        <FeedPostCard post={post} />
      </motion.div>
      {revealed && (
        <p className="px-2 pb-1 text-center text-[10px] text-[var(--muted-foreground)]">
          {revealed === "save" ? "Saved to your list" : "Share ready"}
        </p>
      )}
    </div>
  );
}

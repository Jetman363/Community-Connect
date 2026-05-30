"use client";

import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  UserPlus,
  MoreHorizontal,
  BarChart3,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MockPost } from "@/lib/mock-data/posts";
import { getUserById } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function FeedPostCard({ post }: { post: MockPost }) {
  const author = getUserById(post.authorId);
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);
  const [following, setFollowing] = useState(post.following ?? false);
  const shares = "shares" in post && post.shares != null ? post.shares : 0;

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar initials={author?.avatar ?? "?"} verified={author?.verified} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{author?.displayName}</span>
                <Badge variant="default" className="capitalize text-[10px]">
                  {String(post.category).replace(/[-_]/g, " ")}
                </Badge>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatRelative(post.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!following && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFollowing(true);
                  toast("Following " + author?.displayName, "success");
                }}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{post.content}</p>
      </div>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="w-full max-h-80 object-cover" />
      )}

      {post.poll && (
        <div className="mx-4 mb-4 rounded-xl bg-[var(--muted)] p-4">
          <p className="mb-3 text-sm font-medium">{post.poll.question}</p>
          <div className="space-y-2">
            {post.poll.options.map((opt) => {
              const pct = Math.round((opt.votes / post.poll!.totalVotes) * 100);
              return (
                <div key={opt.id} className="relative overflow-hidden rounded-lg bg-[var(--card)]">
                  <div
                    className="absolute inset-y-0 left-0 bg-[var(--accent)]/10"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                    <span>{opt.label}</span>
                    <span className="text-[var(--muted-foreground)]">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <BarChart3 className="h-3 w-3" />
            {post.poll.totalVotes} votes
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={Heart}
            label={likes.toString()}
            active={liked}
            onClick={handleLike}
            activeClass="text-[var(--emergency)]"
          />
          <ActionBtn icon={MessageCircle} label={post.comments.toString()} />
          <ActionBtn icon={Share2} label={shares.toString()} />
        </div>
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={Bookmark}
            active={saved}
            onClick={() => {
              setSaved(!saved);
              toast(saved ? "Removed from saved" : "Post saved", "success");
            }}
          />
          <ActionBtn
            icon={Flag}
            onClick={() => toast("Report submitted", "info")}
          />
        </div>
      </div>
    </motion.article>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  active,
  onClick,
  activeClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
        active && activeClass
      )}
    >
      <Icon className={cn("h-4 w-4", active && "fill-current")} />
      {label}
    </button>
  );
}

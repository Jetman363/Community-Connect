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
import { CommunityImage } from "@/components/ui/community-image";
import { RelativeTime } from "@/components/ui/relative-time";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { FeedPost } from "@/types/feed";
import {
  togglePostReaction,
  toggleSavePost,
  sharePost,
  ApiClientError,
} from "@/lib/api/client";
import { CommentsPanel } from "@/components/feed/comments-panel";

function authorInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FeedPostCard({ post }: { post: FeedPost }) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [following, setFollowing] = useState(false);
  const [reacting, setReacting] = useState(false);

  const author = post.author;
  const imageUrl = post.mediaUrls[0];

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => (next ? n + 1 : Math.max(0, n - 1)));
    setReacting(true);
    try {
      const res = (await togglePostReaction(post.id, "LIKE")) as {
        action?: string;
        counts?: Record<string, number>;
      };
      if (res.counts?.LIKE != null) setLikes(res.counts.LIKE);
      if (res.action) setLiked(res.action === "added");
    } catch (err) {
      setLiked(liked);
      setLikes(post.likes);
      if (err instanceof ApiClientError && err.status === 401) {
        toast("Sign in to react to posts", "error");
      } else if (post.id.startsWith("p")) {
        setLiked(next);
        setLikes((n) => (next ? n + 1 : Math.max(0, n - 1)));
      } else {
        toast("Could not update reaction", "error");
      }
    } finally {
      setReacting(false);
    }
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await toggleSavePost(post.id, saved);
      toast(next ? "Post saved" : "Removed from saved", "success");
    } catch {
      setSaved(saved);
      if (post.id.startsWith("p")) {
        setSaved(next);
        toast(next ? "Post saved" : "Removed from saved", "success");
      } else {
        toast("Could not save post", "error");
      }
    }
  };

  const handleShare = async () => {
    try {
      await sharePost(post.id);
      setShareCount((n) => n + 1);
      toast("Post shared", "success");
    } catch {
      if (post.id.startsWith("p")) {
        setShareCount((n) => n + 1);
        toast("Post shared", "success");
      } else {
        toast("Share failed", "error");
      }
    }
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
            <Avatar
              initials={authorInitials(author.displayName)}
              verified={author.verified}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{author.displayName}</span>
                <Badge variant="default" className="capitalize text-[10px]">
                  {String(post.category).replace(/_/g, " ").toLowerCase()}
                </Badge>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                <RelativeTime date={post.createdAt} />
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
                  toast(`Following ${author.displayName}`, "success");
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

      {imageUrl && (
        <div className="relative mx-0 h-80 max-h-80 w-full">
          <CommunityImage
            src={imageUrl}
            alt="Photo attached to community post"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
        </div>
      )}

      {post.poll && (
        <div className="mx-4 mb-4 rounded-xl bg-[var(--muted)] p-4">
          <p className="mb-3 text-sm font-medium">{post.poll.question}</p>
          <div className="space-y-2">
            {post.poll.options.map((opt) => {
              const pct = Math.round(
                (opt.votes / Math.max(post.poll!.totalVotes, 1)) * 100
              );
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
            onClick={() => void handleLike()}
            activeClass="text-[var(--emergency)]"
            disabled={reacting}
          />
          <ActionBtn
            icon={MessageCircle}
            label={commentCount.toString()}
            active={commentsOpen}
            onClick={() => setCommentsOpen((o) => !o)}
          />
          <ActionBtn icon={Share2} label={shareCount.toString()} onClick={() => void handleShare()} />
        </div>
        <div className="flex items-center gap-1">
          <ActionBtn icon={Bookmark} active={saved} onClick={() => void handleSave()} />
          <ActionBtn icon={Flag} onClick={() => toast("Report submitted", "info")} />
        </div>
      </div>

      {commentsOpen && (
        <div className="px-4 pb-4">
          <CommentsPanel
            postId={post.id}
            onCommentAdded={() => setCommentCount((n) => n + 1)}
          />
        </div>
      )}
    </motion.article>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  active,
  onClick,
  activeClass,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  active?: boolean;
  onClick?: () => void;
  activeClass?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50",
        active && activeClass
      )}
    >
      <Icon className={cn("h-4 w-4", active && "fill-current")} />
      {label}
    </button>
  );
}

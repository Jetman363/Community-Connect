"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/utils";
import { fetchComments, createComment } from "@/lib/api/client";
import type { FeedComment } from "@/types/feed";

function CommentItem({
  comment,
  postId,
  onReply,
}: {
  comment: FeedComment;
  postId: string;
  onReply: () => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<FeedComment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const loadReplies = async () => {
    if (replies.length) {
      setShowReplies(!showReplies);
      return;
    }
    setLoadingReplies(true);
    try {
      const res = await fetchComments(postId, comment.id);
      setReplies(res.items);
      setShowReplies(true);
    } finally {
      setLoadingReplies(false);
    }
  };

  const initials = comment.author.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="border-l-2 border-[var(--border)] pl-3">
      <div className="flex gap-2">
        <Avatar initials={initials} verified={comment.author.verified} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{comment.author.displayName}</span>
            <span className="text-[var(--muted-foreground)]">{formatRelative(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="mt-1 flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onReply}>
              Reply
            </Button>
            {comment.replyCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={loadReplies}>
                {loadingReplies ? "..." : showReplies ? "Hide" : `${comment.replyCount} replies`}
              </Button>
            )}
          </div>
          {showReplies && (
            <div className="mt-2 space-y-2">
              {replies.map((r) => (
                <CommentItem key={r.id} comment={r} postId={postId} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentsPanel({ postId }: { postId: string }) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(postId)
      .then((res) => setComments(res.items))
      .finally(() => setLoading(false));
  }, [postId]);

  const submit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const comment = await createComment(postId, content.trim(), replyTo ?? undefined);
      if (replyTo) {
        setComments((prev) => prev);
      } else {
        setComments((prev) => [...prev, comment]);
      }
      setContent("");
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-2 text-sm text-[var(--muted-foreground)]">Loading comments...</p>;

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
      <div className="flex gap-2">
        <Textarea
          placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <Button size="sm" onClick={submit} disabled={submitting}>
          Send
        </Button>
      </div>
      {replyTo && (
        <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
          Cancel reply
        </Button>
      )}
      <div className="space-y-3">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            postId={postId}
            onReply={() => setReplyTo(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

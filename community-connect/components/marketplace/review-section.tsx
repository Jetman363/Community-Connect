"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewDto } from "@/types/marketplace";
import { createReview } from "@/lib/api/client";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-6 w-6",
              n <= value ? "fill-amber-400 text-amber-400" : "text-[var(--muted-foreground)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({
  businessId,
  reviews: initial,
  onReviewAdded,
}: {
  businessId: string;
  reviews: ReviewDto[];
  onReviewAdded?: (review: ReviewDto) => void;
}) {
  const [reviews, setReviews] = useState(initial);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (comment.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const review = await createReview({ businessId, rating, comment: comment.trim() });
      setReviews((prev) => [review, ...prev]);
      setComment("");
      onReviewAdded?.(review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border)] p-4">
        <h4 className="font-medium">Write a review</h4>
        <StarInput value={rating} onChange={setRating} />
        <Input
          placeholder="Share your experience (min 10 characters)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-3"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <Button className="mt-3" size="sm" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit review"}
        </Button>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">No reviews yet. Be the first!</p>
        )}
        {reviews.map((r) => (
          <article key={r.id} className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{r.author.displayName}</span>
              <span className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
            {r.ownerResponse && (
              <div className="mt-3 rounded-lg bg-[var(--muted)] p-3 text-sm">
                <strong>Owner response:</strong> {r.ownerResponse}
              </div>
            )}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              {formatRelative(r.createdAt)}
              {r.helpfulCount > 0 && ` · ${r.helpfulCount} found helpful`}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

import { mockPosts } from "@/lib/mock-data/posts";
import { mockNotifications } from "@/lib/mock-data/notifications";
import type { FeedPost } from "@/types/feed";
import type { ApiNotification } from "@/types/feed";

/** Fallback when DATABASE_URL is unreachable — keeps demo auth UX working. */
export function getMockFeedPosts(): FeedPost[] {
  return mockPosts.map((p) => ({
    id: p.id,
    authorId: p.authorId,
    author: {
      id: p.authorId,
      displayName: p.authorId === "demo-resident" ? "Alex Resident" : "Neighbor",
      avatarUrl: null,
      verified: true,
    },
    content: p.content,
    title: null,
    type: p.poll ? "POLL" : p.imageUrl ? "IMAGE" : "TEXT",
    category: mapMockCategory(p.category),
    createdAt: p.createdAt,
    mediaUrls: p.imageUrl ? [p.imageUrl] : [],
    videoUrl: null,
    hashtags: [],
    locationLabel: null,
    poll: p.poll
      ? {
          question: p.poll.question,
          options: p.poll.options,
          totalVotes: p.poll.totalVotes,
          votedOptionId: "votedOptionId" in p.poll ? (p.poll as { votedOptionId?: string }).votedOptionId : undefined,
        }
      : undefined,
    likes: p.likes,
    helpful: 0,
    support: 0,
    comments: p.comments,
    saved: p.saved,
    liked: p.liked,
    userReactions: p.liked ? ["LIKE"] : [],
    shareCount: 0,
    repostOfId: null,
  }));
}

function mapMockCategory(cat: string): FeedPost["category"] {
  const map: Record<string, FeedPost["category"]> = {
    general: "GENERAL",
    safety: "SAFETY",
    events: "EVENTS",
    "lost-found": "NEIGHBORHOOD",
    recommendations: "NEIGHBORHOOD",
  };
  return map[cat] ?? "GENERAL";
}

export function getMockNotifications(): ApiNotification[] {
  return mockNotifications.map((n) => ({
    id: n.id,
    type: n.type.toUpperCase(),
    title: n.title,
    body: n.body,
    read: n.read,
    link: n.href ?? null,
    createdAt: n.createdAt,
  }));
}

import type { PostCategory, PostType, ReactionType } from "@prisma/client";

export interface FeedAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
}

export interface FeedPollOption {
  id: string;
  label: string;
  votes: number;
}

export interface FeedPoll {
  question: string;
  options: FeedPollOption[];
  totalVotes: number;
  votedOptionId?: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  author: FeedAuthor;
  content: string;
  title: string | null;
  type: PostType;
  category: PostCategory;
  createdAt: string;
  mediaUrls: string[];
  videoUrl: string | null;
  hashtags: string[];
  locationLabel: string | null;
  poll?: FeedPoll;
  likes: number;
  helpful: number;
  support: number;
  comments: number;
  saved: boolean;
  liked: boolean;
  userReactions: ReactionType[];
  shareCount: number;
  repostOfId: string | null;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  author: FeedAuthor;
  parentId: string | null;
  content: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  replyCount: number;
  replies?: FeedComment[];
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

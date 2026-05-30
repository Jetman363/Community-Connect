export interface GroupDto {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  coverPhoto?: string | null;
  memberCount: number;
  isPrivate: boolean;
  isMember?: boolean;
  role?: "MODERATOR" | "MEMBER";
}

export interface DealDto {
  id: string;
  title: string;
  description?: string | null;
  discount: string;
  dealType: "PERCENTAGE" | "FIXED" | "BOGO" | "FREEBIE";
  expiresAt: string;
  redeemedCount: number;
  imageUrl?: string | null;
  businessId: string;
  businessName?: string;
  saved?: boolean;
}

export interface ChallengeDto {
  id: string;
  title: string;
  description: string;
  endDate: string;
  participantCount: number;
  milestone: number;
  imageUrl?: string | null;
  joined?: boolean;
  progress?: number;
}

export interface NewsArticleDto {
  id: string;
  title: string;
  source: string;
  summary: string;
  category: string;
  publishedAt: string;
  imageUrl?: string | null;
  url?: string | null;
  aiSummary?: string;
}

export interface PointsDto {
  balance: number;
  level: number;
  streak: number;
  nextLevelAt: number;
}

export interface AchievementDto {
  id: string;
  key: string;
  title: string;
  description: string;
  icon?: string | null;
  points: number;
  earned?: boolean;
  earnedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  balance: number;
  level: number;
}

export interface DiscoverFeedItem {
  id: string;
  type: "post" | "deal" | "event" | "group" | "news" | "challenge";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  score?: number;
  href?: string;
  metadata?: Record<string, unknown>;
}

export interface LifestyleRecommendation {
  id: string;
  title: string;
  description: string;
  category: "dining" | "events" | "outdoors" | "family" | "deals" | "social";
  imageUrl?: string;
  href?: string;
  reason: string;
}

export interface PersonalizationProfileDto {
  interests: string[];
  preferences: Record<string, unknown>;
}

export interface TrendingItemDto {
  id: string;
  entityType: string;
  entityId: string;
  score: number;
  period: string;
  title?: string;
  imageUrl?: string;
}

export interface FamilyActivityDto {
  id: string;
  title: string;
  category: "school" | "sports" | "camp" | "family";
  date: string;
  location?: string;
  ageRange?: string;
  imageUrl?: string;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  action: string;
  target?: string;
  timestamp: string;
}

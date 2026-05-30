import type { FeedPost, ApiNotification, FeedComment } from "@/types/feed";
import type { SocialLinkDto } from "@/types/social";
import type { SocialPlatform } from "@prisma/client";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(
      (data as { error?: string }).error ?? "Request failed",
      res.status,
      (data as { details?: unknown }).details
    );
  }
  return data as T;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return parseResponse<T>(res);
}

export interface FeedResponse {
  items: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
  source?: string;
}

export async function fetchFeed(params: {
  sort?: "latest" | "trending";
  category?: string;
  cursor?: string;
}): Promise<FeedResponse> {
  const qs = new URLSearchParams();
  if (params.sort) qs.set("sort", params.sort);
  if (params.category && params.category !== "all") qs.set("category", params.category.toUpperCase());
  if (params.cursor) qs.set("cursor", params.cursor);
  return apiFetch(`/api/posts?${qs}`);
}

export async function createPost(body: Record<string, unknown>): Promise<FeedPost> {
  return apiFetch("/api/posts", { method: "POST", body: JSON.stringify(body) });
}

export async function togglePostReaction(postId: string, type = "LIKE") {
  return apiFetch(`/api/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

export async function toggleSavePost(postId: string, saved: boolean) {
  return apiFetch(`/api/posts/${postId}/save`, { method: saved ? "DELETE" : "POST" });
}

export async function sharePost(postId: string) {
  return apiFetch(`/api/posts/${postId}/share`, { method: "POST" });
}

export async function fetchComments(postId: string, parentId?: string | null) {
  const qs = parentId ? `?parentId=${parentId}` : "";
  return apiFetch<{ items: FeedComment[] }>(`/api/posts/${postId}/comments${qs}`);
}

export async function createComment(postId: string, content: string, parentId?: string) {
  return apiFetch<FeedComment>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, parentId }),
  });
}

export interface NotificationsResponse {
  items: ApiNotification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
  source?: string;
}

export async function fetchNotifications(cursor?: string): Promise<NotificationsResponse> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiFetch(`/api/notifications${qs}`);
}

export async function markNotificationRead(id: string) {
  return apiFetch("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ id }),
  });
}

export async function markAllNotificationsRead() {
  return apiFetch("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ all: true }),
  });
}

export async function uploadFile(file: File, entityType = "post") {
  const form = new FormData();
  form.append("file", file);
  form.append("entityType", entityType);
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
  return parseResponse<{ id: string; url: string; mimeType: string }>(res);
}

// ─── Marketplace ─────────────────────────────────────────────────────────────

import type {
  MarketplaceListingDto,
  BusinessDto,
  JobListingDto,
  ReviewDto,
  SearchRecommendationsDto,
  ServiceDto,
  BusinessAnalyticsDto,
} from "@/types/marketplace";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  source?: string;
}

export async function fetchListings(params: {
  category?: string;
  search?: string;
  featured?: boolean;
  cursor?: string;
}): Promise<PaginatedResponse<MarketplaceListingDto>> {
  const qs = new URLSearchParams();
  if (params.category && params.category !== "all") qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.featured) qs.set("featured", "true");
  if (params.cursor) qs.set("cursor", params.cursor);
  return apiFetch(`/api/marketplace?${qs}`);
}

export async function fetchListing(id: string): Promise<MarketplaceListingDto> {
  return apiFetch(`/api/marketplace/${id}`);
}

export async function createListing(body: Record<string, unknown>): Promise<MarketplaceListingDto> {
  return apiFetch("/api/marketplace", { method: "POST", body: JSON.stringify(body) });
}

export async function toggleListingFavorite(id: string, favorited: boolean) {
  return apiFetch(`/api/marketplace/${id}/favorite`, {
    method: favorited ? "DELETE" : "POST",
  });
}

export async function sendListingInquiry(listingId: string, message: string) {
  return apiFetch("/api/inquiries", {
    method: "POST",
    body: JSON.stringify({ listingId, message }),
  });
}

// ─── Businesses ──────────────────────────────────────────────────────────────

export async function fetchBusinesses(params: {
  category?: string;
  search?: string;
  verified?: boolean;
  cursor?: string;
}): Promise<PaginatedResponse<BusinessDto>> {
  const qs = new URLSearchParams();
  if (params.category && params.category !== "all") qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.verified) qs.set("verified", "true");
  if (params.cursor) qs.set("cursor", params.cursor);
  return apiFetch(`/api/businesses?${qs}`);
}

export async function fetchBusiness(
  id: string
): Promise<BusinessDto & { services?: ServiceDto[] }> {
  return apiFetch(`/api/businesses/${id}`);
}

export async function fetchBusinessReviews(businessId: string): Promise<{ items: ReviewDto[] }> {
  return apiFetch(`/api/businesses/${businessId}/reviews`);
}

export async function createReview(body: {
  businessId: string;
  rating: number;
  comment?: string;
  categoryRatings?: Record<string, number>;
}): Promise<ReviewDto> {
  return apiFetch("/api/reviews", { method: "POST", body: JSON.stringify(body) });
}

export async function sendBusinessInquiry(businessId: string, message: string, quoteRequest = false) {
  return apiFetch(`/api/businesses/${businessId}/inquiry`, {
    method: "POST",
    body: JSON.stringify({ message, quoteRequest }),
  });
}

export async function toggleBusinessFavorite(id: string, favorited: boolean) {
  return apiFetch(`/api/businesses/${id}/favorite`, {
    method: favorited ? "DELETE" : "POST",
  });
}

export async function fetchBusinessAnalytics(businessId: string): Promise<BusinessAnalyticsDto> {
  return apiFetch(`/api/businesses/${businessId}/analytics`);
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export async function fetchJobs(params: {
  jobType?: string;
  search?: string;
  cursor?: string;
}): Promise<PaginatedResponse<JobListingDto>> {
  const qs = new URLSearchParams();
  if (params.jobType && params.jobType !== "all") qs.set("jobType", params.jobType);
  if (params.search) qs.set("search", params.search);
  if (params.cursor) qs.set("cursor", params.cursor);
  return apiFetch(`/api/jobs?${qs}`);
}

export async function applyToJob(jobId: string, message: string) {
  return apiFetch(`/api/jobs/${jobId}/apply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ─── Search & Discover ───────────────────────────────────────────────────────

export async function discoverSearch(params: {
  q?: string;
  category?: string;
  verified?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category) qs.set("category", params.category);
  if (params.verified) qs.set("verified", "true");
  return apiFetch<{
    listings: MarketplaceListingDto[];
    businesses: BusinessDto[];
    jobs: JobListingDto[];
    source?: string;
  }>(`/api/search/discover?${qs}`);
}

export async function fetchRecommendations(): Promise<SearchRecommendationsDto & { source?: string }> {
  return apiFetch("/api/recommendations");
}

// ─── Social links ────────────────────────────────────────────────────────────

export async function fetchMySocialLinks(): Promise<{ items: SocialLinkDto[] }> {
  return apiFetch("/api/users/me/social-links");
}

export async function fetchPublicSocialLinks(userId: string): Promise<{ items: SocialLinkDto[] }> {
  return apiFetch(`/api/users/${userId}/social-links`);
}

export async function connectSocialLink(body: {
  platform: SocialPlatform;
  profileUrl: string;
  username?: string;
  isPublic?: boolean;
}) {
  return apiFetch<{ link: SocialLinkDto; oauth: string }>("/api/users/me/social-links/connect", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function disconnectSocialLink(platform: SocialPlatform) {
  return apiFetch(`/api/users/me/social-links/disconnect?platform=${platform}`, {
    method: "DELETE",
  });
}

export async function patchSocialLinks(body: {
  isPublic?: boolean;
  platforms?: { platform: SocialPlatform; isPublic: boolean }[];
}) {
  return apiFetch<{ items: SocialLinkDto[] }>("/api/users/me/social-links", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

import type { FeedPost, ApiNotification, FeedComment } from "@/types/feed";

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

import type { UserRole, PostCategory, AlertSeverity, ReportStatus, ListingType } from "@prisma/client";

export type { UserRole, PostCategory, AlertSeverity, ReportStatus, ListingType };

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  verified: boolean;
  displayName?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

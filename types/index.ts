import type {
  UserRole,
  PostCategory,
  AlertSeverity,
  ReportStatus,
  ListingType,
  ListingStatus,
  RsvpStatus,
  MessageType,
  NotificationType,
  HoaDocumentCategory,
} from "@prisma/client";

export type {
  UserRole,
  PostCategory,
  AlertSeverity,
  ReportStatus,
  ListingType,
  ListingStatus,
  RsvpStatus,
  MessageType,
  NotificationType,
  HoaDocumentCategory,
};

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

export interface Phase2StubResponse {
  error: "Not implemented";
  resource: string;
  methods: string[];
  message: string;
}

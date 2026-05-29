export interface MockAdminUser {
  id: string;
  name: string;
  email: string;
  role: "RESIDENT" | "MODERATOR" | "ADMIN";
  status: "active" | "suspended" | "pending";
  joinedAt: string;
  reports: number;
}

export interface MockModerationItem {
  id: string;
  type: "post" | "comment" | "listing" | "user";
  content: string;
  reporter: string;
  reason: string;
  createdAt: string;
  status: "pending" | "reviewed" | "dismissed";
}

export const mockAdminUsers: MockAdminUser[] = [
  {
    id: "demo-resident",
    name: "Alex Resident",
    email: "resident@communityconnect.app",
    role: "RESIDENT",
    status: "active",
    joinedAt: "2024-03-15",
    reports: 0,
  },
  {
    id: "u2",
    name: "Sarah Martinez",
    email: "sarah@example.com",
    role: "RESIDENT",
    status: "active",
    joinedAt: "2023-08-01",
    reports: 0,
  },
  {
    id: "u3",
    name: "James Kim",
    email: "james@example.com",
    role: "RESIDENT",
    status: "active",
    joinedAt: "2024-01-20",
    reports: 1,
  },
  {
    id: "u4",
    name: "Spam Bot 42",
    email: "spam@fake.net",
    role: "RESIDENT",
    status: "suspended",
    joinedAt: "2025-05-28",
    reports: 12,
  },
  {
    id: "demo-admin",
    name: "Demo Admin",
    email: "demo@communityconnect.app",
    role: "ADMIN",
    status: "active",
    joinedAt: "2023-01-01",
    reports: 0,
  },
];

export const mockModerationQueue: MockModerationItem[] = [
  {
    id: "mod1",
    type: "post",
    content: "Suspicious link shared in neighborhood group...",
    reporter: "Sarah M.",
    reason: "Spam / phishing",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: "pending",
  },
  {
    id: "mod2",
    type: "comment",
    content: "Offensive language in event discussion",
    reporter: "Alex R.",
    reason: "Harassment",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: "pending",
  },
  {
    id: "mod3",
    type: "listing",
    content: "Counterfeit electronics listing",
    reporter: "James K.",
    reason: "Fraud",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
  },
  {
    id: "mod4",
    type: "user",
    content: "Spam Bot 42 — multiple spam posts",
    reporter: "System",
    reason: "Automated detection",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    status: "reviewed",
  },
];

export const mockAnalytics = {
  totalUsers: 2847,
  activeToday: 412,
  postsThisWeek: 156,
  alertsActive: 6,
  eventsUpcoming: 12,
  marketplaceListings: 89,
};

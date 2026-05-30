export interface LaunchMetrics {
  dau: number;
  marketplaceListings: number;
  marketplaceInquiries: number;
  eventsThisWeek: number;
  activeAlerts: number;
  aiChatSessions24h: number;
  feedPosts24h: number;
  engagementScore: number;
  systemHealth: "healthy" | "degraded" | "offline";
  generatedAt: string;
  source: "db" | "mock";
}

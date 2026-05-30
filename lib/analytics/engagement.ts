/** Analytics stubs for engagement tracking — wire to analytics provider in production */

export type EngagementEvent =
  | "session_start"
  | "session_end"
  | "page_view"
  | "check_in"
  | "deal_save"
  | "deal_redeem"
  | "challenge_join"
  | "group_join"
  | "discover_scroll"
  | "recommendation_click";

const sessionStore = new Map<string, { startedAt: number; events: number }>();

export function trackEngagement(
  event: EngagementEvent,
  properties?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[engagement]", event, properties ?? {});
  }
}

export function startSession(userId: string): string {
  const sessionId = `sess_${Date.now()}_${userId.slice(0, 6)}`;
  sessionStore.set(sessionId, { startedAt: Date.now(), events: 0 });
  trackEngagement("session_start", { userId, sessionId });
  return sessionId;
}

export function endSession(sessionId: string): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    trackEngagement("session_end", {
      sessionId,
      durationMs: Date.now() - session.startedAt,
      events: session.events,
    });
    sessionStore.delete(sessionId);
  }
}

export function getEngagementMetricsStub() {
  return {
    dau: 847,
    dauChange: 12.4,
    mau: 4200,
    avgSessionMinutes: 8.6,
    retentionDay7: 42,
    retentionDay30: 28,
    checkInsToday: 312,
    dealsRedeemedToday: 89,
    challengesActive: 4,
    topFeatures: [
      { name: "Discover", sessions: 1240 },
      { name: "Deals", sessions: 890 },
      { name: "Groups", sessions: 654 },
      { name: "Home", sessions: 2100 },
    ],
  };
}

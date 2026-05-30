/** Demo analytics when database is offline. */
export function getMockPlatformOverview() {
  return {
    users: 1248,
    communities: 3,
    posts: 4821,
    activeAlerts: 4,
    openReports: 12,
    activeListings: 89,
    moderationQueue: 7,
    generatedAt: new Date().toISOString(),
    source: "mock",
  };
}

export function getMockAnalytics(type: string) {
  const days = 14;
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.floor(20 + Math.random() * 30),
      posts: Math.floor(5 + Math.random() * 15),
      alerts: Math.floor(Math.random() * 3),
      reports: Math.floor(Math.random() * 5),
    };
  });

  const base = { series, source: "mock" as const };
  switch (type) {
    case "engagement":
      return { ...base, posts: 342, comments: 891, reactions: 2104 };
    case "safety":
      return { ...base, alerts: 28, reports: 45 };
    case "marketplace":
      return { ...base, listings: 67, inquiries: 134 };
    case "growth":
      return { ...base, newMembers: 23 };
    case "moderation":
      return { ...base, contentReports: 15, moderationCases: 7 };
    default:
      return base;
  }
}

export function getMockModerationQueue() {
  return {
    cases: [
      {
        id: "mc-demo-1",
        entityType: "POST",
        entityId: "post-1",
        status: "OPEN",
        aiConfidence: 0.72,
        internalNotes: null,
        createdAt: new Date().toISOString(),
        reporter: "Alex Resident",
        assignee: null,
      },
    ],
    contentReports: [],
    marketplace: [],
    source: "mock",
  };
}

export function getMockCommunities() {
  return [
    {
      id: "demo-community",
      name: "Oak Hills Community",
      slug: "demo-community",
      logoUrl: null,
      memberRole: "ADMIN",
    },
    {
      id: "demo-community-2",
      name: "Cedar Park HOA",
      slug: "cedar-park",
      logoUrl: null,
      memberRole: "RESIDENT",
    },
  ];
}

export function getMockOpsDashboard() {
  return {
    activeIncidents: 8,
    unassignedReports: 3,
    criticalCount: 2,
    avgResponseMin: 12,
    placeholderCad: true,
    source: "mock",
  };
}

export function getMockAuditLogs() {
  return {
    items: [
      {
        id: "audit-1",
        action: "user.role.update",
        resource: "user",
        resourceId: "user-1",
        metadata: { role: "MODERATOR" },
        ip: "127.0.0.1",
        communityId: "demo-community",
        organizationId: null,
        createdAt: new Date().toISOString(),
        actor: { id: "demo-admin", displayName: "Demo Admin" },
      },
    ],
    total: 1,
    page: 1,
    limit: 50,
    hasMore: false,
    source: "mock",
  };
}

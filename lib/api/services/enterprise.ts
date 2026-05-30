import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole, ModerationCaseStatus, TaskStatus } from "@prisma/client";
import { randomBytes } from "crypto";

export async function listCommunitiesForUser(userId: string) {
  const memberships = await prisma.communityMember.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      community: {
        include: { organization: true },
      },
    },
  });
  return memberships.map((m) => ({
    id: m.community.id,
    name: m.community.name,
    slug: m.community.slug,
    logoUrl: m.community.logoUrl,
    brandingColors: m.community.brandingColors,
    organization: m.community.organization,
    memberRole: m.role,
  }));
}

export async function createCommunity(data: {
  name: string;
  slug: string;
  description?: string;
  organizationId?: string;
  brandingColors?: Prisma.InputJsonValue;
}) {
  return prisma.community.create({ data });
}

export async function updateCommunity(
  id: string,
  data: Prisma.CommunityUpdateInput
) {
  return prisma.community.update({ where: { id }, data });
}

export async function createCommunityInvite(input: {
  communityId: string;
  email: string;
  role: UserRole;
  invitedById: string;
  expiresInDays?: number;
}) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 7));
  return prisma.communityInvite.create({
    data: {
      communityId: input.communityId,
      email: input.email.toLowerCase(),
      token,
      role: input.role,
      invitedById: input.invitedById,
      expiresAt,
    },
  });
}

export async function listCommunityMembers(communityId: string) {
  const members = await prisma.communityMember.findMany({
    where: { communityId },
    include: { user: { include: { profile: true } } },
    orderBy: { joinedAt: "desc" },
  });
  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt.toISOString(),
    displayName: m.user.profile?.displayName ?? m.user.email,
    email: m.user.email,
    verified: m.user.verified,
  }));
}

export async function updateMemberRole(
  communityId: string,
  userId: string,
  role: UserRole
) {
  return prisma.communityMember.update({
    where: { communityId_userId: { communityId, userId } },
    data: { role },
  });
}

export async function getModerationQueue(communityId?: string) {
  const cases = await prisma.moderationCase.findMany({
    where: {
      status: { in: ["OPEN", "ASSIGNED", "UNDER_REVIEW", "ESCALATED"] },
      ...(communityId ? { communityId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { include: { profile: true } },
      assignedModerator: { include: { profile: true } },
    },
  });

  const contentReports = await prisma.contentReport.findMany({
    where: { status: { in: ["PENDING", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { reporter: { include: { profile: true } } },
  });

  const flaggedListings = await prisma.marketplaceListing.findMany({
    where: {
      status: "FLAGGED",
      ...(communityId ? { communityId } : {}),
    },
    take: 30,
    include: { seller: { include: { profile: true } } },
  });

  return {
    cases: cases.map(mapModerationCase),
    contentReports: contentReports.map((r) => ({
      id: r.id,
      source: "content_report",
      entityType: r.entityType,
      entityId: r.entityId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter.profile?.displayName,
      aiConfidence: null as number | null,
    })),
    marketplace: flaggedListings.map((l) => ({
      id: l.id,
      source: "marketplace",
      entityType: "LISTING",
      entityId: l.id,
      title: l.title,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
      seller: l.seller.profile?.displayName,
      aiConfidence: null as number | null,
    })),
  };
}

function mapModerationCase(c: {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  aiConfidence: number | null;
  internalNotes: string | null;
  createdAt: Date;
  reporter: { profile: { displayName: string } | null } | null;
  assignedModerator: { profile: { displayName: string } | null } | null;
}) {
  return {
    id: c.id,
    entityType: c.entityType,
    entityId: c.entityId,
    status: c.status,
    aiConfidence: c.aiConfidence,
    internalNotes: c.internalNotes,
    createdAt: c.createdAt.toISOString(),
    reporter: c.reporter?.profile?.displayName,
    assignee: c.assignedModerator?.profile?.displayName,
  };
}

export async function updateModerationCase(
  id: string,
  data: {
    status?: ModerationCaseStatus;
    assignedModeratorId?: string | null;
    internalNotes?: string;
  }
) {
  return prisma.moderationCase.update({ where: { id }, data });
}

export async function appendModerationNote(id: string, note: string) {
  const existing = await prisma.moderationCase.findUnique({ where: { id } });
  if (!existing) return null;
  const merged = [existing.internalNotes, `[${new Date().toISOString()}] ${note}`]
    .filter(Boolean)
    .join("\n");
  return prisma.moderationCase.update({
    where: { id },
    data: { internalNotes: merged },
  });
}

export async function suspendUser(input: {
  userId: string;
  issuedById: string;
  reason: string;
  expiresAt?: Date;
  communityId?: string;
}) {
  return prisma.userSuspension.create({
    data: {
      userId: input.userId,
      issuedById: input.issuedById,
      reason: input.reason,
      expiresAt: input.expiresAt,
      communityId: input.communityId,
      status: "ACTIVE",
    },
  });
}

export async function createAppeal(input: {
  suspensionId: string;
  userId: string;
  reason: string;
}) {
  return prisma.appeal.create({ data: input });
}

export async function listTasks(communityId?: string, assigneeId?: string) {
  return prisma.task.findMany({
    where: {
      ...(communityId ? { communityId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    take: 100,
    include: {
      assignee: { include: { profile: true } },
      creator: { include: { profile: true } },
    },
  });
}

export async function createTask(data: Prisma.TaskCreateInput) {
  return prisma.task.create({ data });
}

export async function updateTask(
  id: string,
  data: { status?: TaskStatus; assigneeId?: string | null; notes?: string; priority?: import("@prisma/client").TaskPriority }
) {
  return prisma.task.update({ where: { id }, data });
}

export async function listWorkflowCases(communityId: string) {
  return prisma.workflowCase.findMany({
    where: { communityId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getOpsIncidents(communityId: string) {
  const [reports, alerts] = await Promise.all([
    prisma.report.findMany({
      where: {
        communityId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        reporter: { include: { profile: true } },
        assignedTo: { include: { profile: true } },
      },
    }),
    prisma.safetyAlert.findMany({
      where: { communityId, active: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return [
    ...reports.map((r) => ({
      id: r.id,
      type: "report" as const,
      title: r.title,
      severity: r.severity,
      status: r.status,
      category: r.category,
      lat: r.lat,
      lng: r.lng,
      assignee: r.assignedTo?.profile?.displayName,
      createdAt: r.createdAt.toISOString(),
    })),
    ...alerts.map((a) => ({
      id: a.id,
      type: "alert" as const,
      title: a.title,
      severity: a.severity,
      status: a.active ? "ACTIVE" : "CLOSED",
      category: a.category,
      lat: a.lat,
      lng: a.lng,
      assignee: null,
      createdAt: a.createdAt.toISOString(),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOpsDashboard(communityId: string) {
  const incidents = await getOpsIncidents(communityId);
  const unassigned = incidents.filter((i) => i.type === "report" && !i.assignee).length;
  const critical = incidents.filter(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  ).length;

  return {
    activeIncidents: incidents.length,
    unassignedReports: unassigned,
    criticalCount: critical,
    avgResponseMin: 12,
    placeholderCad: true,
  };
}

export async function assignOpsIncident(
  id: string,
  communityId: string,
  assigneeId: string
) {
  return prisma.report.update({
    where: { id, communityId },
    data: { assignedToId: assigneeId, status: "IN_PROGRESS" },
  });
}

export async function listBroadcasts(communityId: string) {
  return prisma.broadcast.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createBroadcast(data: Prisma.BroadcastCreateInput) {
  return prisma.broadcast.create({ data });
}

export async function sendBroadcast(id: string) {
  return prisma.broadcast.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
  });
}

// HOA
export async function listHoaAnnouncements(communityId: string) {
  return prisma.hOAAnnouncement.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listHoaDocuments(communityId: string) {
  return prisma.hoaDocument.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listVotes(communityId: string) {
  return prisma.vote.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    include: { ballots: true },
  });
}

export async function castVote(voteId: string, userId: string, optionIndex: number) {
  const vote = await prisma.vote.findUnique({ where: { id: voteId } });
  if (!vote || vote.status !== "OPEN") return { error: "Vote not open" };
  if (!vote.anonymous) {
    const existing = await prisma.voteBallot.findFirst({
      where: { voteId, userId },
    });
    if (existing) return { error: "Already voted" };
  }
  await prisma.voteBallot.create({
    data: { voteId, userId: vote.anonymous ? null : userId, optionIndex },
  });
  return { ok: true };
}

export async function listMeetings(communityId: string) {
  return prisma.meeting.findMany({
    where: { communityId },
    orderBy: { startsAt: "asc" },
  });
}

export async function listCommunityRules(communityId: string) {
  return prisma.communityRule.findMany({
    where: { communityId, active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listMaintenanceRequests(communityId: string, requesterId?: string) {
  return prisma.maintenanceRequest.findMany({
    where: {
      communityId,
      ...(requesterId ? { requesterId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { requester: { include: { profile: true } } },
  });
}

export async function listViolationReports(communityId: string) {
  return prisma.violationReport.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function seedPermissions() {
  const defs = [
    { key: "posts:moderate", resource: "posts", action: "moderate", scope: "COMMUNITY" as const },
    { key: "alerts:publish", resource: "alerts", action: "publish", scope: "COMMUNITY" as const },
    { key: "admin:analytics", resource: "admin", action: "analytics", scope: "GLOBAL" as const },
    { key: "hoa:vote", resource: "hoa", action: "vote", scope: "COMMUNITY" as const },
    { key: "moderation:queue", resource: "moderation", action: "queue", scope: "COMMUNITY" as const },
    { key: "users:suspend", resource: "users", action: "suspend", scope: "GLOBAL" as const },
    { key: "ops:dispatch", resource: "ops", action: "dispatch", scope: "COMMUNITY" as const },
  ];

  for (const d of defs) {
    await prisma.permission.upsert({
      where: { key: d.key },
      update: {},
      create: d,
    });
  }
}

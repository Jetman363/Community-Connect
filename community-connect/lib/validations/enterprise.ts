import { z } from "zod";

export const communityCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  organizationId: z.string().optional(),
  brandingColors: z.record(z.string(), z.string()).optional(),
});

export const communityPatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().nullable(),
  brandingColors: z.record(z.string(), z.string()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "RESIDENT",
    "VERIFIED_USER",
    "BUSINESS_OWNER",
    "MODERATOR",
    "COMMUNITY_MODERATOR",
    "HOA_MANAGER",
    "PUBLIC_SAFETY",
    "DISPATCHER",
    "SUPERVISOR",
    "ADMIN",
  ]).default("RESIDENT"),
});

export const memberRolePatchSchema = z.object({
  role: z.enum([
    "RESIDENT",
    "VERIFIED_USER",
    "BUSINESS_OWNER",
    "MODERATOR",
    "COMMUNITY_MODERATOR",
    "HOA_MANAGER",
    "PUBLIC_SAFETY",
    "DISPATCHER",
    "SUPERVISOR",
    "ADMIN",
    "SUPER_ADMIN",
    "ENTERPRISE_CLIENT",
  ]),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: z.string().datetime().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  communityId: z.string().optional(),
});

export const taskPatchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"]).optional(),
  assigneeId: z.string().nullable().optional(),
  notes: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const moderationCasePatchSchema = z.object({
  status: z
    .enum(["OPEN", "ASSIGNED", "UNDER_REVIEW", "RESOLVED", "ESCALATED", "DISMISSED"])
    .optional(),
  assignedModeratorId: z.string().nullable().optional(),
  internalNotes: z.string().max(10000).optional(),
});

export const moderationNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const suspendUserSchema = z.object({
  reason: z.string().min(3).max(500),
  expiresAt: z.string().datetime().optional(),
  communityId: z.string().optional(),
});

export const appealSchema = z.object({
  suspensionId: z.string(),
  reason: z.string().min(10).max(2000),
});

export const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  severity: z.enum(["INFO", "ADVISORY", "WARNING", "EMERGENCY"]).default("INFO"),
  channels: z.record(z.string(), z.boolean()).optional(),
  scheduledAt: z.string().datetime().optional(),
  communityId: z.string().optional(),
});

export const hoaAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  priority: z.string().default("normal"),
});

export const maintenanceRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  location: z.string().max(200).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const violationReportSchema = z.object({
  description: z.string().min(10).max(5000),
  address: z.string().max(200).optional(),
  anonymous: z.boolean().default(false),
});

export const voteCastSchema = z.object({
  optionIndex: z.number().int().min(0),
});

export const auditQuerySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  actorId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  communityId: z.string().optional(),
});

export const roleAssignmentSchema = z.object({
  userId: z.string(),
  role: z.enum([
    "RESIDENT",
    "VERIFIED_USER",
    "BUSINESS_OWNER",
    "MODERATOR",
    "COMMUNITY_MODERATOR",
    "HOA_MANAGER",
    "PUBLIC_SAFETY",
    "DISPATCHER",
    "SUPERVISOR",
    "ADMIN",
    "SUPER_ADMIN",
    "ENTERPRISE_CLIENT",
  ]),
  communityId: z.string().optional(),
  organizationId: z.string().optional(),
});

export const opsAssignSchema = z.object({
  assigneeId: z.string(),
});

export const opsStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

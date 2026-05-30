import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ruleSchema = z.object({
  name: z.string().min(1),
  trigger: z.enum([
    "NEW_INCIDENT",
    "NEW_REPORT",
    "NEW_ALERT",
    "VERIFICATION_APPROVED",
    "CUSTOM",
  ]),
  conditions: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(
    z.object({
      type: z.enum(["notify", "escalate", "assign", "create_task", "create_workflow_case"]),
      params: z.record(z.string(), z.unknown()).default({}),
    })
  ),
  enabled: z.boolean().default(false),
  organizationId: z.string(),
  communityId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.AUTOMATION_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const orgId = req.nextUrl.searchParams.get("organizationId");
  const rules = await prisma.workflowAutomation.findMany({
    where: orgId ? { organizationId: orgId } : {},
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ items: rules });
}

export async function POST(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.AUTOMATION_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const rule = await prisma.workflowAutomation.create({
    data: {
      name: parsed.data.name,
      trigger: parsed.data.trigger,
      conditions: parsed.data.conditions ?? undefined,
      actions: parsed.data.actions,
      enabled: parsed.data.enabled,
      organizationId: parsed.data.organizationId,
      communityId: parsed.data.communityId,
    },
  });

  return jsonOk(rule, 201);
}

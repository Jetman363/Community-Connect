import { prisma } from "@/lib/prisma";
import type { ActionResult, AutomationAction, TriggerContext } from "./types";

async function executeAction(
  action: AutomationAction,
  ctx: TriggerContext
): Promise<ActionResult> {
  switch (action.type) {
    case "notify":
      return {
        action: action.type,
        success: true,
        detail: `Notification queued: ${String(action.params.title ?? ctx.entityId)}`,
      };
    case "escalate":
      if (ctx.entityType === "report") {
        await prisma.report.updateMany({
          where: { id: ctx.entityId, communityId: ctx.communityId ?? undefined },
          data: { severity: "CRITICAL" },
        });
      }
      return { action: action.type, success: true };
    case "assign":
      if (ctx.entityType === "report" && action.params.assigneeId) {
        await prisma.report.updateMany({
          where: { id: ctx.entityId, communityId: ctx.communityId ?? undefined },
          data: { assignedToId: String(action.params.assigneeId) },
        });
      }
      return { action: action.type, success: true };
    case "create_task":
      await prisma.task.create({
        data: {
          title: String(action.params.title ?? "Automation task"),
          notes: String(action.params.notes ?? ""),
          communityId: ctx.communityId ?? undefined,
          creatorId: String(action.params.creatorId ?? ctx.entityId),
          entityType: ctx.entityType,
          entityId: ctx.entityId,
        },
      });
      return { action: action.type, success: true };
    case "create_workflow_case":
      if (ctx.communityId) {
        await prisma.workflowCase.create({
          data: {
            communityId: ctx.communityId,
            type: "INCIDENT",
            title: String(action.params.title ?? "Automated case"),
            description: String(action.params.description ?? ""),
            entityType: ctx.entityType,
            entityId: ctx.entityId,
          },
        });
      }
      return { action: action.type, success: true };
    default:
      return { action: action.type, success: false, detail: "Unknown action" };
  }
}

function matchesConditions(
  conditions: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  for (const [key, expected] of Object.entries(conditions)) {
    if (payload[key] !== expected) return false;
  }
  return true;
}

export async function evaluateAutomations(ctx: TriggerContext): Promise<ActionResult[]> {
  const rules = await prisma.workflowAutomation.findMany({
    where: {
      enabled: true,
      trigger: ctx.trigger,
      organizationId: ctx.organizationId,
      OR: [{ communityId: null }, { communityId: ctx.communityId ?? undefined }],
    },
  });

  const results: ActionResult[] = [];

  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, unknown> | null;
    if (!matchesConditions(conditions, ctx.payload)) continue;

    const actions = rule.actions as AutomationAction[];
    const runResults: ActionResult[] = [];

    for (const action of actions) {
      runResults.push(await executeAction(action, ctx));
    }

    await prisma.automationRunLog.create({
      data: {
        automationId: rule.id,
        status: runResults.every((r) => r.success) ? "SUCCESS" : "FAILED",
        triggerData: ctx.payload,
        result: runResults,
      },
    });

    results.push(...runResults);
  }

  return results;
}

export async function testAutomationRule(
  ruleId: string,
  samplePayload: Record<string, unknown>
): Promise<ActionResult[]> {
  const rule = await prisma.workflowAutomation.findUnique({ where: { id: ruleId } });
  if (!rule) return [];

  const ctx: TriggerContext = {
    trigger: rule.trigger,
    entityType: "test",
    entityId: "test-entity",
    payload: samplePayload,
    organizationId: rule.organizationId,
    communityId: rule.communityId,
  };

  const actions = rule.actions as AutomationAction[];
  const results: ActionResult[] = [];
  for (const action of actions) {
    results.push(await executeAction(action, ctx));
  }
  return results;
}

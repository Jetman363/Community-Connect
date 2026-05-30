import type { AutomationTriggerType } from "@prisma/client";

export type AutomationActionType =
  | "notify"
  | "escalate"
  | "assign"
  | "create_task"
  | "create_workflow_case";

export interface AutomationAction {
  type: AutomationActionType;
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTriggerType;
  conditions?: Record<string, unknown>;
  actions: AutomationAction[];
  enabled: boolean;
  organizationId: string;
  communityId?: string | null;
}

export interface TriggerContext {
  trigger: AutomationTriggerType;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  organizationId: string;
  communityId?: string | null;
}

export interface ActionResult {
  action: AutomationActionType;
  success: boolean;
  detail?: string;
}

import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { listTasks, createTask } from "@/lib/api/services/enterprise";
import { taskCreateSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { emitToUser } from "@/lib/realtime/emit";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.TASKS_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    const assigneeId = req.nextUrl.searchParams.get("assigneeId") ?? undefined;
    const items = await withDbTimeout(listTasks(communityId ?? undefined, assigneeId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.TASKS_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      parsed.data.communityId ?? (await resolveCommunityId(req, auth.payload.sub));
    const task = await withDbTimeout(
      createTask({
        title: parsed.data.title,
        notes: parsed.data.notes,
        priority: parsed.data.priority,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        community: communityId ? { connect: { id: communityId } } : undefined,
        creator: { connect: { id: auth.payload.sub } },
        assignee: parsed.data.assigneeId
          ? { connect: { id: parsed.data.assigneeId } }
          : undefined,
      })
    );
    if (task.assigneeId) {
      emitToUser(task.assigneeId, SOCKET_EVENTS.TASK_ASSIGNED, {
        id: task.id,
        title: task.title,
      });
    }
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "task.create",
      resource: "task",
      resourceId: task.id,
      communityId: communityId ?? undefined,
    });
    return jsonOk(task, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

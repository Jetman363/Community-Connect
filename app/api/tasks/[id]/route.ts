import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { updateTask } from "@/lib/api/services/enterprise";
import { taskPatchSchema } from "@/lib/validations/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { emitToUser } from "@/lib/realtime/emit";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.TASKS_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = taskPatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const prev = await prisma.task.findUnique({ where: { id } });
    const task = await withDbTimeout(updateTask(id, parsed.data));
    if (parsed.data.assigneeId && parsed.data.assigneeId !== prev?.assigneeId) {
      emitToUser(parsed.data.assigneeId, SOCKET_EVENTS.TASK_ASSIGNED, {
        id: task.id,
        title: task.title,
      });
    }
    return jsonOk(task);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

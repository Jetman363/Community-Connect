import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "PUBLIC_SAFETY");
  if (!("payload" in auth)) return auth;

  const assigneeId = auth.payload.sub;
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ assigneeId }, { creatorId: assigneeId }],
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return jsonOk({ items: tasks });
}

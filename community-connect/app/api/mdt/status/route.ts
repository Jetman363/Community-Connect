import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusSchema = z.object({
  unitId: z.string().optional(),
  status: z.enum(["available", "en_route", "on_scene", "off_duty"]),
  incidentId: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req, "PUBLIC_SAFETY");
  if (!("payload" in auth)) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  // MDT status stored in audit log for traceability (no dedicated MDT table in v1)
  await prisma.auditLog.create({
    data: {
      actorId: auth.payload.sub,
      action: "mdt.unit.status",
      resource: "mdt",
      metadata: parsed.data,
    },
  });

  return jsonOk({ updated: true, ...parsed.data });
}

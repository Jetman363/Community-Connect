import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { scanContent } from "@/lib/ai/moderation";
import { z } from "zod";

const schema = z.object({
  entityType: z.enum(["POST", "COMMENT", "LISTING", "USER", "REPORT", "OTHER"]),
  entityId: z.string().min(1),
  content: z.string().min(1).max(10000),
  communityId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400);

  const result = await scanContent({
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    content: parsed.data.content,
    communityId: parsed.data.communityId,
    reporterId: auth.payload.sub,
  });

  return jsonOk(result);
}

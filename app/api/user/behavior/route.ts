import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { trackBehavior } from "@/lib/api/services/radius-user";
import { z } from "zod";

const schema = z.object({
  eventType: z.enum(["VIEW", "CLICK", "SEARCH", "SAVE", "SHARE", "NAVIGATE"]),
  entityType: z.string().min(1).max(50),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const result = await trackBehavior(auth.payload.sub, parsed.data);
  return jsonOk(result);
}

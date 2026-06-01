import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getUserPreferences, updateUserPreferences } from "@/lib/api/services/radius-user";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const data = await getUserPreferences(auth.payload.sub);
  return jsonOk(data);
}

const patchSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  pushAlerts: z.boolean().optional(),
  emergencyAlerts: z.boolean().optional(),
  profileVisibility: z.enum(["public", "community", "private"]).optional(),
  searchVisibility: z.enum(["public", "community", "private"]).optional(),
  activityVisibility: z.enum(["public", "community", "private"]).optional(),
  communityVisibility: z.enum(["public", "community", "private"]).optional(),
  radiusMiles: z.number().min(1).max(100).optional(),
  menuLocked: z.boolean().optional(),
  navOrder: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const data = await updateUserPreferences(auth.payload.sub, parsed.data);
  return jsonOk(data);
}

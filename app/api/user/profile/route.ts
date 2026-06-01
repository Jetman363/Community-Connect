import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getUserProfile, updateUserProfile } from "@/lib/api/services/radius-user";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const data = await getUserProfile(auth.payload.sub);
  return jsonOk(data);
}

const patchSchema = z.object({
  displayName: z.string().min(2).max(64).optional(),
  firstName: z.string().min(1).max(32).optional(),
  lastName: z.string().min(1).max(32).optional(),
  bio: z.string().max(500).optional(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().optional(),
  neighborhood: z.string().max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const data = await updateUserProfile(auth.payload.sub, parsed.data);
  return jsonOk(data);
}

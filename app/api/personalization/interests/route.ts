import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getPersonalizationProfile, updateInterests } from "@/lib/api/services/personalization";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const profile = await getPersonalizationProfile(auth.payload.sub);
  try {
    const rows = await prisma.userInterest.findMany({
      where: { userId: auth.payload.sub },
      select: { topic: true },
    });
    return jsonOk({ interests: rows.map((r) => r.topic), profile });
  } catch {
    return jsonOk({ interests: profile.interests, profile });
  }
}

const postSchema = z.object({
  interests: z.array(z.string()).min(1).max(20),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const data = await updateInterests(auth.payload.sub, parsed.data.interests);
  return jsonOk(data);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

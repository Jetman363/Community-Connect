import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getActiveCommunityId } from "@/lib/api/community-context";
import { listMeetings } from "@/lib/api/services/enterprise";
import { z } from "zod";
import { canManageHOA } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

const meetingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  minutesUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(listMeetings(communityId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, "HOA_MANAGER");
  if (!("payload" in auth)) return auth;
  if (!canManageHOA(auth.payload.role)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = meetingSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const item = await withDbTimeout(
      prisma.meeting.create({
        data: {
          communityId,
          title: parsed.data.title,
          description: parsed.data.description,
          location: parsed.data.location,
          startsAt: new Date(parsed.data.startsAt),
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
          minutesUrl: parsed.data.minutesUrl,
        },
      })
    );
    return jsonOk(item, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

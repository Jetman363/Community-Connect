import { NextRequest, NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { ACTIVE_COMMUNITY_COOKIE } from "@/lib/api/community-context";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ communityId: z.string() });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const member = await withDbTimeout(
      prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: parsed.data.communityId,
            userId: auth.payload.sub,
          },
        },
      })
    );
    if (!member || member.status !== "ACTIVE") {
      return jsonError("Not a member of this community", 403);
    }
  } catch {
    if (process.env.NODE_ENV !== "development") {
      return jsonError("Database unavailable", 503);
    }
  }

  const res = jsonOk({ communityId: parsed.data.communityId });
  res.cookies.set(ACTIVE_COMMUNITY_COOKIE, parsed.data.communityId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

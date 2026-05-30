import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getActiveCommunityId } from "@/lib/api/community-context";
import { listVotes } from "@/lib/api/services/enterprise";
import { z } from "zod";
import { canManageHOA } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

const voteSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  options: z.array(z.string()).min(2),
  anonymous: z.boolean().default(false),
  isBoardElection: z.boolean().default(false),
  endsAt: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(listVotes(communityId));
    return jsonOk({
      items: items.map((v) => ({
        ...v,
        ballotCount: v.ballots.length,
        ballots: undefined,
      })),
    });
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
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const vote = await withDbTimeout(
      prisma.vote.create({
        data: {
          communityId,
          title: parsed.data.title,
          description: parsed.data.description,
          options: parsed.data.options,
          anonymous: parsed.data.anonymous,
          isBoardElection: parsed.data.isBoardElection,
          status: "OPEN",
          endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
        },
      })
    );
    return jsonOk(vote, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

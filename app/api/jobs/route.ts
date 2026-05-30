import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { jobSchema } from "@/lib/validations";
import { z } from "zod";
import { listJobs, createJob } from "@/lib/api/services/jobs";
import { getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { getMockJobs } from "@/lib/api/fallback-marketplace";

const jobsQuerySchema = z.object({
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "GIG", "VOLUNTEER"]).optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = jobsQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ items: getMockJobs(), nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }
    const result = await withDbTimeout(listJobs({ communityId, userId, ...parsed.data }));
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockJobs(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Failed to load jobs", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "job-create"), 8, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json();
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community membership", 400);

    const job = await withDbTimeout(
      createJob({
        communityId,
        posterId: auth.payload.sub,
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      })
    );
    return jsonOk(job, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create job", 500);
  }
}

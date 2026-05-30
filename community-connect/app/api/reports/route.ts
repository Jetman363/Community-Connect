import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { reportSchema } from "@/lib/validations";
import { z } from "zod";
import { listReports, createReport } from "@/lib/api/services/reports";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { getMockIncidentReports } from "@/lib/api/fallback-safety";
import { broadcastReportNew } from "@/lib/realtime/safety-broadcast";

const reportsQuerySchema = z.object({
  status: z
    .enum(["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .optional(),
  category: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusM: z.coerce.number().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = reportsQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({
          items: getMockIncidentReports(),
          nextCursor: null,
          hasMore: false,
          source: "mock",
        });
      }
      return jsonError("No community context", 400);
    }

    const result = await withDbTimeout(
      listReports({
        communityId,
        userId: auth.payload.sub,
        status: parsed.data.status,
        category: parsed.data.category as never,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        radiusM: parsed.data.radiusM,
        cursor: parsed.data.cursor,
        limit: parsed.data.limit,
      })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({
        items: getMockIncidentReports(),
        nextCursor: null,
        hasMore: false,
        source: "mock",
      });
    }
    return jsonError("Failed to load reports", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "reports-create"), 5, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community membership", 400);

    const report = await withDbTimeout(
      createReport({
        communityId,
        reporterId: auth.payload.sub,
        ...parsed.data,
      })
    );

    broadcastReportNew(report, communityId);
    return jsonOk(report, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create report", 500);
  }
}

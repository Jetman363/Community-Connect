import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { z } from "zod";
import { appendReportMedia, getReportById } from "@/lib/api/services/reports";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

const mediaSchema = z.object({ urls: z.array(z.string().url()).min(1).max(10) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  const body = await req.json();
  const parsed = mediaSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId = await withDbTimeout(getDefaultCommunityId(auth.payload.sub));
    if (!communityId) return jsonError("No community context", 400);

    const existing = await getReportById(id, communityId, auth.payload.sub);
    if (!existing) return jsonError("Not found", 404);
    if (existing.reporter?.id !== auth.payload.sub) {
      return jsonError("Forbidden", 403);
    }

    const report = await withDbTimeout(
      appendReportMedia(id, communityId, parsed.data.urls)
    );
    if (!report) return jsonError("Not found", 404);
    return jsonOk(report);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to attach media", 500);
  }
}

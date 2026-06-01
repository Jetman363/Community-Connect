import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { contentReportSchema } from "@/lib/validations";
import { createContentReport } from "@/lib/api/services/moderation";

/** Content moderation reports (distinct from safety `/api/reports` incident reports). */
export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "content-report"), 10, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = contentReportSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const report = await withDbTimeout(
      createContentReport({
        reporterId: auth.payload.sub,
        ...parsed.data,
      })
    );
    return jsonOk({ id: report.id, status: report.status }, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to submit report", 500);
  }
}

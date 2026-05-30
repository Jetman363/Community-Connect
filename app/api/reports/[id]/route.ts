import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { updateReportSchema } from "@/lib/validations";
import { getReportById, updateReport } from "@/lib/api/services/reports";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { canModerate } from "@/lib/permissions/rbac";
import { broadcastReportStatus } from "@/lib/realtime/safety-broadcast";
import { notifyReportStatus } from "@/lib/api/services/notifications";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community context", 400);

    const report = await withDbTimeout(
      getReportById(id, communityId, auth.payload.sub)
    );
    if (!report) return jsonError("Not found", 404);
    return jsonOk(report);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load report", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateReportSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  const isStaff = canModerate(auth.payload.role);

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community context", 400);

    const existing = await getReportById(id, communityId, auth.payload.sub);
    if (!existing) return jsonError("Not found", 404);

    if (!isStaff && existing.reporter?.id !== auth.payload.sub) {
      return jsonError("Forbidden", 403);
    }
    if (!isStaff && (parsed.data.status || parsed.data.assignedToId)) {
      return jsonError("Only staff can update status or assignment", 403);
    }

    const report = await withDbTimeout(
      updateReport(id, communityId, parsed.data, auth.payload.sub)
    );

    if (parsed.data.status && existing.reporter?.id) {
      await notifyReportStatus({
        userId: existing.reporter.id,
        reportId: id,
        status: parsed.data.status,
        title: report.title,
      });
      broadcastReportStatus(report, communityId, existing.reporter.id);
    }

    return jsonOk(report);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update report", 500);
  }
}

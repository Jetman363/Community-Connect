import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { exportAnalyticsCsv, type AnalyticsType } from "@/lib/api/services/analytics";
import { getMockAnalytics } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_ANALYTICS,
  });
  if (!("payload" in auth)) return auth;

  const type = (req.nextUrl.searchParams.get("type") ?? "engagement") as AnalyticsType;
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  if (format !== "csv") return jsonError("Only csv export supported", 400);

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    if (!communityId) return jsonError("No community context", 400);

    const csv = await withDbTimeout(exportAnalyticsCsv(communityId, type));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${type}.csv"`,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      const mock = getMockAnalytics(type);
      const series = mock.series ?? [];
      const header = "date,value";
      const rows = series.map((r: { date: string; value?: number }) => `${r.date},${r.value ?? 0}`);
      return new NextResponse([header, ...rows].join("\n"), {
        headers: { "Content-Type": "text/csv" },
      });
    }
    return jsonError("Export failed", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { searchAuditLogs, auditLogsToCsv } from "@/lib/api/services/audit";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_AUDIT,
  });
  if (!("payload" in auth)) return auth;

  try {
    const result = await withDbTimeout(searchAuditLogs({ limit: 500 }));
    const csv = auditLogsToCsv(result.items);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="audit-logs.csv"',
      },
    });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Export failed", 500);
  }
}

import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { getSystemHealth, getPlatformOverview } from "@/lib/api/services/analytics";
import { getIntegrationHealth } from "@/lib/api/services/integrations";
import { searchAuditLogs } from "@/lib/api/services/audit";
import { getMockAuditLogs, getMockPlatformOverview } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/prisma";
import { getUptimeSeconds } from "@/lib/observability/metrics";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_SYSTEM,
  });
  if (!("payload" in auth)) return auth;

  try {
    const [overview, audit, sessionCount] = await Promise.all([
      withDbTimeout(getPlatformOverview()).catch(() => getMockPlatformOverview()),
      withDbTimeout(
        searchAuditLogs({ page: 1, limit: 10 })
      ).catch(() => getMockAuditLogs()),
      withDbTimeout(
        prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } })
      ).catch(() => null),
    ]);

    const integrations = await getIntegrationHealth({
      organizationId: null,
      communityId: null,
    }).catch(() => ({ connectors: [], syncLast24h: [] }));

    const errorLike = (audit.items ?? []).filter((item) =>
      /error|fail|denied|reject/i.test(item.action)
    );

    return jsonOk({
      generatedAt: new Date().toISOString(),
      uptimeSeconds: getUptimeSeconds(),
      activeUsers: overview.users ?? 0,
      sessionCount: sessionCount ?? overview.users ?? 0,
      systemHealth: getSystemHealth(),
      integrations,
      recentErrors: errorLike.slice(0, 8),
      pagePerformance: {
        p95Ms: 420,
        avgMs: 180,
        note: "Placeholder — wire to RUM / Vercel Analytics in production",
      },
    });
  } catch (err) {
    if (isDbUnavailable(err)) {
      return jsonOk({
        generatedAt: new Date().toISOString(),
        uptimeSeconds: getUptimeSeconds(),
        activeUsers: getMockPlatformOverview().users,
        sessionCount: getMockPlatformOverview().users,
        systemHealth: getSystemHealth(),
        integrations: { connectors: [], syncLast24h: [] },
        recentErrors: getMockAuditLogs().items.slice(0, 5),
        pagePerformance: { p95Ms: 420, avgMs: 180, note: "Placeholder" },
        source: "fallback",
      });
    }
    return jsonError("Failed to load monitoring data", 500);
  }
}

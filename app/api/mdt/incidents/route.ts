import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/response";
import { requireAuth } from "@/lib/api/auth";
import { resolveConnectorBySlug } from "@/lib/integrations/resolve-connector";
import { MockCadConnector } from "@/lib/integrations/connectors/cad/mock-cad-connector";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "PUBLIC_SAFETY");
  if (!("payload" in auth)) return auth;

  const communityId = req.nextUrl.searchParams.get("communityId");
  const community = communityId
    ? await prisma.community.findUnique({
        where: { id: communityId },
        select: { organizationId: true },
      })
    : null;

  const scope = { organizationId: community?.organizationId ?? null, communityId };

  const resolved = await resolveConnectorBySlug("mock-cad", scope);
  if (resolved?.connector instanceof MockCadConnector) {
    const items = await resolved.connector.listIncidents();
    return jsonOk({ items });
  }

  const reports = communityId
    ? await prisma.report.findMany({
        where: { communityId, status: { in: ["SUBMITTED", "IN_PROGRESS", "UNDER_REVIEW"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          severity: true,
          status: true,
          lat: true,
          lng: true,
          createdAt: true,
        },
      })
    : [];

  return jsonOk({ items: reports, source: "community-reports" });
}

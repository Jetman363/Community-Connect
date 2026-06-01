import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getEngagementMetricsStub } from "@/lib/analytics/engagement";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "ADMIN");
  if (!("payload" in auth)) return auth;
  return jsonOk(getEngagementMetricsStub());
}

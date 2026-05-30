import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getLaunchMetrics } from "@/lib/api/services/launch-metrics";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "ADMIN");
  if (!("payload" in auth)) return auth;

  const data = await getLaunchMetrics();
  const res = jsonOk(data);
  res.headers.set("Cache-Control", "private, max-age=60");
  return res;
}

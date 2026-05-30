import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { testAutomationRule } from "@/lib/automation/rules-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.AUTOMATION_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  let samplePayload: Record<string, unknown> = {};
  try {
    const body = (await req.json()) as { payload?: Record<string, unknown> };
    samplePayload = body.payload ?? {};
  } catch {
    /* empty payload ok */
  }

  const results = await testAutomationRule(id, samplePayload);
  return jsonOk({ results, dryRun: true });
}

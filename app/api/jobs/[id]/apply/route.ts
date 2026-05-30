import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

/** Placeholder — Phase 6 will add applications workflow. */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return jsonOk({
    jobId: id,
    applicantId: auth.payload.sub,
    status: "SUBMITTED",
    message: (body as { message?: string }).message ?? null,
    note: "Application recorded (placeholder). Full workflow in Phase 6.",
  }, 201);
}

import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { createAppeal } from "@/lib/api/services/enterprise";
import { appealSchema } from "@/lib/validations/enterprise";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = appealSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const appeal = await withDbTimeout(
      createAppeal({
        suspensionId: parsed.data.suspensionId,
        userId: auth.payload.sub,
        reason: parsed.data.reason,
      })
    );
    return jsonOk(appeal, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

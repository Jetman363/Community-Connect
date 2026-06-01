import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { deleteAccountStub } from "@/lib/api/services/radius-user";
import { z } from "zod";

const schema = z.object({
  confirmEmail: z.string().email(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const result = await deleteAccountStub(auth.payload.sub, parsed.data.confirmEmail);
  if (!result.ok) return jsonError(result.error ?? "Confirmation failed", 400);
  return jsonOk(result);
}

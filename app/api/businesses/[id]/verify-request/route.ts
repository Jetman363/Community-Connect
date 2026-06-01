import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { verificationRequestSchema } from "@/lib/validations";
import { createVerificationRequest } from "@/lib/api/services/verification";
import { canManageBusiness } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canManageBusiness(auth.payload.role)) {
    return jsonError("Business owner role required", 403);
  }
  const { id: businessId } = await params;
  const body = await req.json();
  const parsed = verificationRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business || business.ownerId !== auth.payload.sub) {
      return jsonError("Not found or forbidden", 404);
    }
    const request = await withDbTimeout(
      createVerificationRequest(businessId, parsed.data.type, parsed.data.documents ?? [])
    );
    return jsonOk(request, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to submit verification", 500);
  }
}

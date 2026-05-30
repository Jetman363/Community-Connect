import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { businessSchema } from "@/lib/validations";
import {
  getBusiness,
  updateBusiness,
  listBusinessServices,
  toBusinessUpdateInput,
} from "@/lib/api/services/businesses";
import { getMockBusinessesDto } from "@/lib/api/fallback-marketplace";
import { canManageBusiness, canModerate } from "@/lib/permissions/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  try {
    const [business, services] = await Promise.all([
      withDbTimeout(getBusiness(id, userId)),
      withDbTimeout(listBusinessServices(id)),
    ]);
    if (!business) return jsonError("Not found", 404);
    return jsonOk({ ...business, services });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const mock = getMockBusinessesDto().find((b) => b.id === id);
      if (mock) return jsonOk({ ...mock, services: [] });
    }
    return jsonError("Failed to load business", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = businessSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  const ownerOnly = !canModerate(auth.payload.role);
  try {
    const business = await withDbTimeout(
      updateBusiness(id, toBusinessUpdateInput(parsed.data), ownerOnly ? auth.payload.sub : undefined)
    );
    if (!business) return jsonError("Not found or forbidden", 404);
    return jsonOk(business);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update business", 500);
  }
}

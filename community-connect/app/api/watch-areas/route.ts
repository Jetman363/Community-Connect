import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { watchAreaSchema } from "@/lib/validations";
import { listWatchAreas } from "@/lib/api/services/geofences";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listWatchAreas(auth.payload.sub));
    return jsonOk({ items, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonOk({ items: [], source: "mock" });
    return jsonError("Failed to load watch areas", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = watchAreaSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const area = await withDbTimeout(
      prisma.watchArea.create({
        data: {
          userId: auth.payload.sub,
          name: parsed.data.name,
          type: parsed.data.type ?? "CUSTOM",
          centerLat: parsed.data.centerLat,
          centerLng: parsed.data.centerLng,
          radiusM: parsed.data.radiusM ?? 804,
        },
      })
    );
    return jsonOk(
      {
        id: area.id,
        name: area.name,
        type: area.type,
        centerLat: area.centerLat,
        centerLng: area.centerLng,
        radiusM: area.radiusM,
      },
      201
    );
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to save watch area", 500);
  }
}

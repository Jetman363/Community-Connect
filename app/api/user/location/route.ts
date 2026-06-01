import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getUserLocation,
  upsertUserLocation,
  getSavedLocations,
  createSavedLocation,
} from "@/lib/api/services/radius-user";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const saved = req.nextUrl.searchParams.get("saved") === "1";
  if (saved) {
    const locations = await getSavedLocations(auth.payload.sub);
    return jsonOk({ locations });
  }
  const data = await getUserLocation(auth.payload.sub);
  return jsonOk(data);
}

const locationSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
  precise: z.boolean().optional(),
  sharingEnabled: z.boolean().optional(),
  source: z.enum(["GPS", "MANUAL"]).optional(),
});

const savedSchema = z.object({
  label: z.string().min(1).max(100),
  lat: z.number(),
  lng: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const saved = savedSchema.safeParse(body);
  if (saved.success) {
    const loc = await createSavedLocation(auth.payload.sub, saved.data);
    return jsonOk(loc);
  }
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const data = await upsertUserLocation(auth.payload.sub, parsed.data);
  return jsonOk(data);
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());
  const data = await upsertUserLocation(auth.payload.sub, parsed.data);
  return jsonOk(data);
}

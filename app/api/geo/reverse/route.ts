import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { z } from "zod";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return jsonError("Invalid coordinates", 400, parsed.error.flatten());

  const result = await reverseGeocode(parsed.data.lat, parsed.data.lng);
  return jsonOk(result);
}

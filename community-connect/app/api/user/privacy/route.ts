import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getPrivacySettings } from "@/lib/api/services/radius-user";
import { upsertUserLocation, updateUserPreferences } from "@/lib/api/services/radius-user";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const data = await getPrivacySettings(auth.payload.sub);
  return jsonOk(data);
}

const patchSchema = z.object({
  locationSharingEnabled: z.boolean().optional(),
  preciseLocation: z.boolean().optional(),
  profileVisibility: z.enum(["public", "community", "private"]).optional(),
  searchVisibility: z.enum(["public", "community", "private"]).optional(),
  activityVisibility: z.enum(["public", "community", "private"]).optional(),
  communityVisibility: z.enum(["public", "community", "private"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonOk({ ok: false });

  const { locationSharingEnabled, preciseLocation, ...prefs } = parsed.data;
  if (locationSharingEnabled != null || preciseLocation != null) {
    await upsertUserLocation(auth.payload.sub, {
      sharingEnabled: locationSharingEnabled,
      precise: preciseLocation,
    });
  }
  if (Object.keys(prefs).length > 0) {
    await updateUserPreferences(auth.payload.sub, prefs);
  }
  const data = await getPrivacySettings(auth.payload.sub);
  return jsonOk(data);
}

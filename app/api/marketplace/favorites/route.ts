import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { listFavorites } from "@/lib/api/services/favorites";
import { getMockMarketplaceListings } from "@/lib/api/fallback-marketplace";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listFavorites(auth.payload.sub, "LISTING"));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const mock = getMockMarketplaceListings().filter((l) => l.favorited);
      return jsonOk({
        items: mock.map((l) => ({
          id: `fav-${l.id}`,
          targetType: "LISTING" as const,
          targetId: l.id,
          label: l.title,
          createdAt: l.createdAt,
        })),
      });
    }
    return jsonError("Failed to load favorites", 500);
  }
}

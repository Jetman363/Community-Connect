import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  try {
    const listing = await withDbTimeout(
      prisma.marketplaceListing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        select: { id: true, title: true, communityId: true },
      })
    );
    const shareUrl = `${req.nextUrl.origin}/marketplace?listing=${listing.id}`;
    return jsonOk({ shareUrl, title: listing.title });
  } catch {
    return jsonError("Listing not found", 404);
  }
}

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { follow, unfollow } from "@/lib/api/services/follows";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const auth = requireAuth(_req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  try {
    await withDbTimeout(follow(auth.payload.sub, "BUSINESS", id));
    return jsonOk({ following: true }, 201);
  } catch {
    return jsonError("Failed to follow business", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = requireAuth(_req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  try {
    await withDbTimeout(unfollow(auth.payload.sub, "BUSINESS", id));
    return jsonOk({ following: false });
  } catch {
    return jsonError("Failed to unfollow business", 500);
  }
}

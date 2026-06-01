import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { storeUpload, validateUpload } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { getDefaultCommunityId } from "@/lib/api/services/posts";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "upload"), 20, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    const err = validateUpload(file.type, file.size);
    if (err) return jsonError(err, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeUpload(buffer, file.name);

    const communityId =
      (formData.get("communityId") as string | null) ??
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));

    const entityType = (formData.get("entityType") as string | null) ?? "post";
    const postId = formData.get("postId") as string | null;

    const upload = await withDbTimeout(
      prisma.mediaUpload.create({
        data: {
          uploaderId: auth.payload.sub,
          communityId: communityId ?? undefined,
          postId: postId ?? undefined,
          url: stored.url,
          mimeType: file.type,
          sizeBytes: file.size,
          entityType,
          status: "UPLOADED",
        },
      })
    );

    return jsonOk(
      {
        id: upload.id,
        url: upload.url,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
      },
      201
    );
  } catch (err) {
    if (isDbUnavailable(err)) {
      return jsonError("Database unavailable — file stored locally but not tracked", 503);
    }
    return jsonError("Upload failed", 500);
  }
}

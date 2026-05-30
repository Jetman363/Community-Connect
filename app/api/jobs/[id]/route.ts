import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { jobSchema } from "@/lib/validations";
import { getJob, updateJob, deleteJob } from "@/lib/api/services/jobs";
import { getMockJobs } from "@/lib/api/fallback-marketplace";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  try {
    const job = await withDbTimeout(getJob(id, userId));
    if (!job) return jsonError("Not found", 404);
    return jsonOk(job);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const mock = getMockJobs().find((j) => j.id === id);
      if (mock) return jsonOk(mock);
    }
    return jsonError("Failed to load job", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = jobSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
  try {
    const job = await withDbTimeout(
      updateJob(id, { ...parsed.data, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined }, auth.payload.sub)
    );
    if (!job) return jsonError("Not found or forbidden", 404);
    return jsonOk(job);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update job", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  try {
    const ok = await withDbTimeout(deleteJob(id, auth.payload.sub));
    if (!ok) return jsonError("Not found or forbidden", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to delete job", 500);
  }
}

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { createInquiry } from "@/lib/api/services/inquiries";
import { broadcastInquiryNew } from "@/lib/realtime/marketplace-broadcast";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const applySchema = z.object({
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest, { params }: Params) {
  const rl = rateLimit(clientKey(req, "job-apply"), 10, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id: jobId } = await params;
  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const job = await prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { posterId: true, businessId: true },
    });
    if (!job) return jsonError("Job not found", 404);

    const result = await withDbTimeout(
      createInquiry({
        userId: auth.payload.sub,
        jobId,
        businessId: job.businessId ?? undefined,
        message: parsed.data.message,
      })
    );
    if (result.spam) return jsonError("Message blocked as spam", 400);
    broadcastInquiryNew(job.posterId, result.inquiry);
    return jsonOk(result.inquiry, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to apply", 500);
  }
}

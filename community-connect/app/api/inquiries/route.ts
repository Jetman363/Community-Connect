import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { inquirySchema } from "@/lib/validations";
import { createInquiry, listInquiries } from "@/lib/api/services/inquiries";
import { broadcastInquiryNew } from "@/lib/realtime/marketplace-broadcast";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(
      listInquiries(auth.payload.sub, auth.payload.role)
    );
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonOk({ items: [] });
    return jsonError("Failed to load inquiries", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "inquiry-create"), 10, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json();
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  if (!parsed.data.listingId && !parsed.data.businessId && !parsed.data.jobId) {
    return jsonError("Target required (listing, business, or job)", 400);
  }

  try {
    const result = await withDbTimeout(
      createInquiry({
        userId: auth.payload.sub,
        businessId: parsed.data.businessId,
        listingId: parsed.data.listingId,
        jobId: parsed.data.jobId,
        message: parsed.data.message,
        quoteRequest: parsed.data.quoteRequest ?? false,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone,
      })
    );
    if (result.spam) return jsonError("Message blocked as spam", 400);

    if (parsed.data.businessId) {
      const biz = await prisma.business.findUnique({
        where: { id: parsed.data.businessId },
        select: { ownerId: true },
      });
      if (biz?.ownerId) broadcastInquiryNew(biz.ownerId, result.inquiry);
    }
    return jsonOk(result.inquiry, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to send inquiry", 500);
  }
}

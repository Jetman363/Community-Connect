import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { z } from "zod";
import { updateInquiryStatus } from "@/lib/api/services/inquiries";
import type { InquiryStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "CLOSED", "SPAM"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const inquiry = await withDbTimeout(
      updateInquiryStatus(id, parsed.data.status as InquiryStatus, auth.payload.sub)
    );
    if (!inquiry) return jsonError("Not found or forbidden", 404);
    return jsonOk(inquiry);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update inquiry", 500);
  }
}

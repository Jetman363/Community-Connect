import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { withDbTimeout } from "@/lib/db/timeout";

const deleteSchema = z.object({
  confirmEmail: z.string().email(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.confirmEmail.toLowerCase() !== auth.payload.email.toLowerCase()) {
    return NextResponse.json({ error: "Email confirmation does not match" }, { status: 400 });
  }

  try {
    // Stub workflow: record deletion request; actual purge runs via scheduled job
    logAudit({
      actorId: auth.payload.sub,
      action: "user.deletion_requested",
      resource: auth.payload.sub,
      metadata: { reason: parsed.data.reason },
    });

    await withDbTimeout(
      prisma.auditLog.create({
        data: {
          actorId: auth.payload.sub,
          action: "account.deletion.pending",
          resource: auth.payload.sub,
          metadata: {
            requestedAt: new Date().toISOString(),
            gracePeriodDays: 30,
            reason: parsed.data.reason,
          },
        },
      })
    );

    return NextResponse.json({
      status: "pending",
      message:
        "Account deletion scheduled. You have 30 days to cancel by contacting support.",
      scheduledPurgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Deletion request failed" }, { status: 503 });
  }
}

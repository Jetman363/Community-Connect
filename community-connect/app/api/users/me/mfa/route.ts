import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { withDbTimeout } from "@/lib/db/timeout";

const mfaSchema = z.object({
  enabled: z.boolean(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await withDbTimeout(
      prisma.user.findUnique({
        where: { id: auth.payload.sub },
        select: { mfaEnabled: true },
      })
    );
    return NextResponse.json({
      mfaEnabled: user?.mfaEnabled ?? false,
      methods: ["totp"],
      setupRequired: false,
    });
  } catch {
    return NextResponse.json({ mfaEnabled: false, methods: ["totp"], setupRequired: false });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = mfaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.enabled) {
    // Stub: return setup URI placeholder; real TOTP secret generation in Phase 9
    return NextResponse.json({
      status: "setup_required",
      message: "MFA enrollment placeholder — scan QR in Phase 9",
      otpauthUrl: "otpauth://totp/CommunityConnect:user?secret=PLACEHOLDER&issuer=CommunityConnect",
    });
  }

  try {
    await withDbTimeout(
      prisma.user.update({
        where: { id: auth.payload.sub },
        data: { mfaEnabled: false },
      })
    );
    logAudit({ actorId: auth.payload.sub, action: "user.mfa_disabled", resource: auth.payload.sub });
    return NextResponse.json({ mfaEnabled: false });
  } catch {
    return NextResponse.json({ error: "MFA update failed" }, { status: 503 });
  }
}

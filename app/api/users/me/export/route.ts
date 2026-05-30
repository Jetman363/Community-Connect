import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { withDbTimeout } from "@/lib/db/timeout";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await withDbTimeout(
      prisma.user.findUnique({
        where: { id: auth.payload.sub },
        include: {
          profile: true,
          posts: { select: { id: true, content: true, createdAt: true }, take: 100 },
          notifications: { take: 50, orderBy: { createdAt: "desc" } },
        },
      })
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logAudit({
      actorId: auth.payload.sub,
      action: "user.data_export",
      resource: auth.payload.sub,
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      format: "json",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.verified,
          createdAt: user.createdAt,
          profile: user.profile,
        },
        posts: user.posts,
        notifications: user.notifications,
      },
      note: "GDPR export stub — extend with full relation graph before production.",
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 503 });
  }
}

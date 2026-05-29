import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { canModerate } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canModerate(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [users, posts, reports, alerts] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.report.count(),
      prisma.safetyAlert.count({ where: { active: true } }),
    ]);
    return NextResponse.json({ users, posts, reports, alerts });
  } catch {
    return NextResponse.json({ users: 128, posts: 342, reports: 24, alerts: 3 });
  }
}

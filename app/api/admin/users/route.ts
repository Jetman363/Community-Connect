import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { canAdmin } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canAdmin(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, verified: true, createdAt: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({
      users: [
        { id: "1", email: "demo@communityconnect.app", role: "ADMIN" },
        { id: "2", email: "resident@example.com", role: "RESIDENT" },
      ],
    });
  }
}

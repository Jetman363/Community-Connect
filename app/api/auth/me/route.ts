import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.payload.sub },
      include: { profile: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
      profile: user.profile,
    });
  } catch {
    return NextResponse.json({
      email: auth.payload.email,
      role: auth.payload.role,
      verified: auth.payload.verified,
    });
  }
}

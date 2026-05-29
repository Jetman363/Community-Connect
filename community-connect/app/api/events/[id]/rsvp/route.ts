import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id: eventId } = await params;

  try {
    const rsvp = await prisma.rSVP.upsert({
      where: { eventId_userId: { eventId, userId: auth.payload.sub } },
      create: { eventId, userId: auth.payload.sub, status: "going" },
      update: { status: "going" },
    });
    return NextResponse.json({ rsvp });
  } catch {
    return NextResponse.json({ ok: true, stub: true });
  }
}

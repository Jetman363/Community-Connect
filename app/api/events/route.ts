import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { eventSchema } from "@/lib/validations";
import { demoEvents } from "@/lib/demo-data";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { rsvps: true } } },
    });
    return NextResponse.json({ items: events });
  } catch {
    return NextResponse.json({
      items: demoEvents.map((e) => ({
        ...e,
        _count: { rsvps: e.rsvpCount },
      })),
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = eventSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const event = await prisma.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
      },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

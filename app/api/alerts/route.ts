import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { canPublishSafetyAlert } from "@/lib/rbac";
import { demoAlerts } from "@/lib/demo-data";
import { z } from "zod";

const alertSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  severity: z.enum(["INFO", "ADVISORY", "WARNING", "EMERGENCY"]).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function GET() {
  try {
    const alerts = await prisma.safetyAlert.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items: alerts });
  } catch {
    return NextResponse.json({ items: demoAlerts });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canPublishSafetyAlert(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = alertSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const alert = await prisma.safetyAlert.create({ data: parsed.data });
    try {
      const { emitAlert } = await import("@/lib/socket-server");
      emitAlert(alert);
    } catch {
      /* Socket server not running */
    }
    return NextResponse.json({ alert }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

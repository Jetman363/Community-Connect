import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { reportSchema } from "@/lib/validations";
import { categorizeReport } from "@/lib/ai";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: auth.payload.sub },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: reports });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "reports"), 15, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = reportSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const aiCategory = await categorizeReport(parsed.data.title, parsed.data.description);

  try {
    const report = await prisma.report.create({
      data: {
        reporterId: auth.payload.sub,
        title: parsed.data.title,
        description: parsed.data.description,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        mediaUrls: parsed.data.mediaUrls ?? [],
        aiCategory,
      },
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({
      report: { status: "SUBMITTED", aiCategory, ...parsed.data },
    });
  }
}

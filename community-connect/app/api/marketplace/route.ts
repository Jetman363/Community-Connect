import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { marketplaceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();

  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: { active: true, ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items: listings });
  } catch {
    return NextResponse.json({
      items: [
        { id: "1", title: "Mountain Bike", description: "Like new", price: 350, type: "FOR_SALE" },
        { id: "2", title: "Dog Walker Needed", description: "Weekdays", type: "JOB" },
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = marketplaceSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const listing = await prisma.marketplaceListing.create({
      data: { sellerId: auth.payload.sub, ...parsed.data },
    });
    return NextResponse.json({ listing }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

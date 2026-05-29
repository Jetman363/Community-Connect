import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoBusinesses } from "@/lib/demo-data";

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({ orderBy: { rating: "desc" }, take: 50 });
    return NextResponse.json({ items: businesses });
  } catch {
    return NextResponse.json({ items: demoBusinesses });
  }
}

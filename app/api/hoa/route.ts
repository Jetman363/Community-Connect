import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [announcements, documents, votes] = await Promise.all([
      prisma.hOAAnnouncement.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.document.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.vote.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    return NextResponse.json({ announcements, documents, votes });
  } catch {
    return NextResponse.json({
      announcements: [
        { id: "1", title: "Pool maintenance", content: "Pool closed Mon–Wed for repairs." },
      ],
      documents: [
        { id: "1", title: "Community Bylaws 2024" },
        { id: "2", title: "Architectural Guidelines" },
      ],
      votes: [{ id: "1", title: "New playground equipment", status: "OPEN" }],
    });
  }
}

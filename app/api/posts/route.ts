import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { postSchema } from "@/lib/validations";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { demoPosts } from "@/lib/demo-data";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return NextResponse.json({ items: posts });
  } catch {
    return NextResponse.json({
      items: demoPosts.map((p) => ({
        id: p.id,
        content: p.content,
        category: p.category,
        createdAt: p.createdAt,
        author: { profile: { displayName: p.author.displayName }, email: "demo@local" },
        _count: { likes: p.likes, comments: p.comments },
      })),
    });
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "posts"), 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const post = await prisma.post.create({
      data: {
        authorId: auth.payload.sub,
        content: parsed.data.content,
        title: parsed.data.title,
        category: parsed.data.category,
        mediaUrls: parsed.data.mediaUrls ?? [],
      },
      include: { author: { include: { profile: true } } },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

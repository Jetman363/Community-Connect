import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { setAuthCookie } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "register"), 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, displayName, role } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: { create: { displayName } },
      },
      include: { profile: true },
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
    });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role, displayName: user.profile?.displayName },
    });
    setAuthCookie(res, token);
    await logAudit({ actorId: user.id, action: "user.register", resource: user.id });
    return res;
  } catch {
    return NextResponse.json({ error: "Database unavailable. Run migrations and seed." }, { status: 503 });
  }
}

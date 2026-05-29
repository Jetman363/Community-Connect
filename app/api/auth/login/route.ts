import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { setAuthCookie } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "login"), 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile?.displayName,
      },
    });
    setAuthCookie(res, token);
    await logAudit({ actorId: user.id, action: "user.login", resource: user.id });
    return res;
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

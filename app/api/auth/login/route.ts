import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { authenticateDemoUser } from "@/lib/auth/demo-users";
import { loginSchema } from "@/lib/validations";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { setAuthCookie } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { withDbTimeout } from "@/lib/db/timeout";

function loginResponse(user: {
  id: string;
  email: string;
  role: Parameters<typeof signToken>[0]["role"];
  verified: boolean;
  displayName?: string;
}) {
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
      displayName: user.displayName,
    },
  });
  setAuthCookie(res, token);
  logAudit({ actorId: user.id, action: "user.login", resource: user.id });
  return res;
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "login"), 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const demoUser = authenticateDemoUser(email, password);
  if (demoUser) {
    return loginResponse(demoUser);
  }

  try {
    const user = await withDbTimeout(
      prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      })
    );

    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return loginResponse({
      id: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
      displayName: user.profile?.displayName,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Database unavailable. Copy .env.example to .env and run migrations, or use demo credentials in dev.",
      },
      { status: 503 }
    );
  }
}

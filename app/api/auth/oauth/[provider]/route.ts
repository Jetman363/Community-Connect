import { NextRequest, NextResponse } from "next/server";

/** OAuth stub — wire provider SDKs in production */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const allowed = ["google", "apple", "facebook"];
  if (!allowed.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }
  return NextResponse.json({
    message: `${provider} OAuth stub`,
    authorizeUrl: `/api/auth/oauth/${provider}/callback?code=stub`,
  });
}

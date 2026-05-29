import { NextResponse } from "next/server";

/** OAuth provider stub — wire real OAuth in Phase 2+. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return NextResponse.json(
    {
      error: "Not implemented",
      provider,
      message: "OAuth integration is stubbed for Phase 1. Use email/password auth.",
    },
    { status: 501 }
  );
}

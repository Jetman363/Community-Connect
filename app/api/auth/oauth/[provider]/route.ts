import { NextResponse } from "next/server";

const PROVIDERS = ["google", "apple", "facebook"] as const;

/** OAuth provider stub — returns coming soon for UI integration. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!PROVIDERS.includes(provider as (typeof PROVIDERS)[number])) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }
  return NextResponse.json(
    {
      status: "coming_soon",
      provider,
      message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is coming soon to Radius. Use email/password for now.`,
    },
    { status: 503 }
  );
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  return GET(_req, { params });
}

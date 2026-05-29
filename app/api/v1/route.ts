import { NextResponse } from "next/server";

/** Versioned API entry point — Phase 2 will mount feature handlers here. */
export async function GET() {
  return NextResponse.json({
    version: "v1",
    status: "ok",
    endpoints: [
      "/api/v1/communities",
      "/api/v1/posts",
      "/api/v1/alerts",
      "/api/v1/events",
      "/api/v1/messages",
    ],
    note: "Feature handlers return 501 until Phase 2.",
  });
}

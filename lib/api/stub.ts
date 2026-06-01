import { NextResponse } from "next/server";

/** Phase 2 placeholder for feature API routes. */
export function phase2Stub(resource: string, methods: string[] = ["GET", "POST"]) {
  return NextResponse.json(
    {
      error: "Not implemented",
      resource,
      methods,
      message: `${resource} API will be implemented in Phase 2.`,
    },
    { status: 501 }
  );
}

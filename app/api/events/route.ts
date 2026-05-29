import { phase2Stub } from "@/lib/api/stub";

export async function GET() {
  return phase2Stub("events", ["GET"]);
}

export async function POST() {
  return phase2Stub("events", ["POST"]);
}

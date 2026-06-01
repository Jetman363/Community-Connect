import { phase2Stub } from "@/lib/api/stub";

export async function GET() {
  return phase2Stub("v1/messages", ["GET"]);
}

export async function POST() {
  return phase2Stub("v1/messages", ["POST"]);
}

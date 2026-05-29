import { phase2Stub } from "@/lib/api/stub";

export async function POST() {
  return phase2Stub("ai/chat", ["POST"]);
}

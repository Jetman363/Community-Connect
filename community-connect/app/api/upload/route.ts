import { phase2Stub } from "@/lib/api/stub";

export async function POST() {
  return phase2Stub("upload", ["POST"]);
}

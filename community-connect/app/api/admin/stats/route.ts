import { phase2Stub } from "@/lib/api/stub";

export async function GET() {
  return phase2Stub("admin/stats", ["GET"]);
}

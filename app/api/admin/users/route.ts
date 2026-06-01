import { phase2Stub } from "@/lib/api/stub";

export async function GET() {
  return phase2Stub("admin/users", ["GET"]);
}

export async function PATCH() {
  return phase2Stub("admin/users", ["PATCH"]);
}

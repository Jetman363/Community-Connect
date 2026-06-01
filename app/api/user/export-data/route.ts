import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { exportUserDataStub } from "@/lib/api/services/radius-user";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const data = await exportUserDataStub(auth.payload.sub);
  return jsonOk(data);
}

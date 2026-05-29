import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { storeUpload, validateUpload } from "@/lib/storage";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "upload"), 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const err = validateUpload(file.type, file.size);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeUpload(buffer, file.name);
  return NextResponse.json({ file: stored });
}

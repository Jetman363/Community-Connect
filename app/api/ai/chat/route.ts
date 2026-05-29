import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { aiChatSchema } from "@/lib/validations";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "ai"), 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = aiChatSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const reply = await chatCompletion(parsed.data.messages);
  return NextResponse.json({ reply, mock: !process.env.OPENAI_API_KEY });
}

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { runAssistant, type AssistantMessage } from "@/lib/ai/assistant";
import { getPersonalizationProfile } from "@/lib/api/services/personalization";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid body", 400, parsed.error.flatten());

  const profile = await getPersonalizationProfile(auth.payload.sub);

  const response = await runAssistant(
    parsed.data.message,
    (parsed.data.history ?? []) as AssistantMessage[],
    {
      userId: auth.payload.sub,
      displayName: auth.payload.email,
      interests: profile.interests,
      locationLabel: "Oak Hills, TX (demo)",
      recentActivity: [
        "Viewed marketplace listings",
        "Checked community feed",
        profile.interests[0] ? `Interest: ${profile.interests[0]}` : "Exploring discover",
      ],
    }
  );

  return jsonOk(response);
}

import "server-only";
import { aiComplete, safeParseJson, type AiSource } from "@/lib/ai/core";
import { checkListingScamRisk } from "@/lib/ai/scam-detection";

export interface ListingAiInsights {
  suggestedPrice?: { low: number; high: number; currency: string };
  optimizationTips: string[];
  scam: { risk: "low" | "medium" | "high"; flags: string[] };
  source: AiSource | "rules";
}

export async function analyzeListing(input: {
  title: string;
  description?: string;
  price?: number;
  category?: string;
}): Promise<ListingAiInsights> {
  const scam = checkListingScamRisk(input.title, input.description);

  const { content, source } = await aiComplete({
    system: `You help sellers on a local marketplace. Return JSON: suggestedPrice {low, high, currency}, optimizationTips (string[] max 4). Be practical for suburban community listings.`,
    user: JSON.stringify({
      title: input.title,
      description: input.description?.slice(0, 500),
      price: input.price,
      category: input.category,
    }),
    json: true,
    maxTokens: 400,
  });

  const parsed = safeParseJson<{
    suggestedPrice?: { low: number; high: number; currency: string };
    optimizationTips?: string[];
  }>(content, {});

  const tips =
    parsed.optimizationTips?.length
      ? parsed.optimizationTips
      : ruleBasedTips(input, scam.risk);

  let suggestedPrice = parsed.suggestedPrice;
  if (!suggestedPrice && input.price != null) {
    suggestedPrice = {
      low: Math.round(input.price * 0.9),
      high: Math.round(input.price * 1.15),
      currency: "USD",
    };
  }

  return {
    suggestedPrice,
    optimizationTips: tips,
    scam,
    source: source === "openai" ? "openai" : "rules",
  };
}

function ruleBasedTips(
  input: { title: string; description?: string },
  risk: "low" | "medium" | "high"
): string[] {
  const tips: string[] = [];
  if (!input.description || input.description.length < 40) {
    tips.push("Add a detailed description with condition, pickup location, and dimensions.");
  }
  if (!/\d/.test(input.title)) {
    tips.push("Include brand, model, or size in the title for better search visibility.");
  }
  tips.push("Use clear photos in daylight; first image matters most in search.");
  if (risk !== "low") {
    tips.push("Avoid off-platform payment requests — meet locally and use in-app messaging.");
  }
  return tips.slice(0, 4);
}

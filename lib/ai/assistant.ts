import "server-only";
import { aiComplete, safeParseJson, type AiSource } from "@/lib/ai/core";

export interface AssistantContext {
  userId?: string;
  displayName?: string;
  interests?: string[];
  locationLabel?: string;
  recentActivity?: string[];
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantResponse {
  reply: string;
  suggestions: string[];
  domain?: string;
  source: AiSource;
}

const DOMAIN_PROMPTS = [
  "community feed and neighborhood posts",
  "marketplace listings, pricing, and scam awareness",
  "local events and activities",
  "verified businesses and services",
  "HOA rules and violations",
  "public safety alerts and incident reporting",
  "personalized recommendations",
] as const;

export async function runAssistant(
  message: string,
  history: AssistantMessage[] = [],
  context: AssistantContext = {}
): Promise<AssistantResponse> {
  const interests = context.interests?.length
    ? context.interests.join(", ")
    : "events, community, marketplace";
  const location = context.locationLabel ?? "Oak Hills (demo)";
  const recent = context.recentActivity?.slice(0, 5).join("; ") ?? "No recent activity logged";

  const system = `You are Community Connect AI, a helpful local community assistant.
Domains: ${DOMAIN_PROMPTS.join("; ")}.
Respond concisely (2-4 sentences). Suggest 2-3 follow-up prompts as JSON array "suggestions".
Identify primary "domain" as one of: community, marketplace, events, business, hoa, safety, recommendations.
User interests: ${interests}. Location: ${location}. Recent: ${recent}.`;

  const historyText = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const { content, source } = await aiComplete({
    system,
    user: `${historyText ? `History:\n${historyText}\n\n` : ""}User: ${message}`,
    json: true,
    maxTokens: 600,
  });

  const parsed = safeParseJson<{
    reply?: string;
    suggestions?: string[];
    domain?: string;
  }>(content, {});

  return {
    reply:
      parsed.reply ??
      (source === "mock"
        ? mockReply(message, interests)
        : "I'm here to help with your community. What would you like to explore?"),
    suggestions: parsed.suggestions?.slice(0, 4) ?? defaultSuggestions(interests),
    domain: parsed.domain,
    source,
  };
}

function mockReply(message: string, interests: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("market") || lower.includes("sell") || lower.includes("buy")) {
    return `I can help you browse marketplace listings and spot scam signals. Your interests include ${interests}. Try /marketplace or ask about pricing tips.`;
  }
  if (lower.includes("event") || lower.includes("tonight")) {
    return "Check Events for farmers markets, meetups, and family activities near Oak Hills.";
  }
  if (lower.includes("alert") || lower.includes("safety") || lower.includes("report")) {
    return "For safety, open Alerts for active notices or use Report to file a non-emergency issue.";
  }
  if (lower.includes("hoa")) {
    return "HOA section covers rules, violations, and board announcements for your neighborhood.";
  }
  return `Thanks for asking about "${message.slice(0, 80)}". Community Connect covers feed, marketplace, events, groups, and local businesses — all tuned to your interests (${interests}).`;
}

function defaultSuggestions(interests: string): string[] {
  const base = [
    "What's trending in my community?",
    "Find marketplace deals near me",
    "Any safety alerts today?",
  ];
  if (interests.includes("events")) base.unshift("Events happening this weekend");
  if (interests.includes("marketplace")) base.unshift("Help me price a listing");
  return base.slice(0, 4);
}

export { QUICK_PROMPTS } from "@/lib/ai/prompts";

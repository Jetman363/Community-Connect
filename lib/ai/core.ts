import "server-only";

export type AiSource = "openai" | "mock";

export interface AiCompletionOptions {
  system: string;
  user: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompletionResult {
  content: string;
  source: AiSource;
}

const OPENAI_KEY = process.env.OPENAI_API_KEY?.trim();

export function isOpenAiEnabled(): boolean {
  return Boolean(OPENAI_KEY);
}

let clientPromise: Promise<import("openai").default | null> | null = null;

async function getOpenAiClient(): Promise<import("openai").default | null> {
  if (!OPENAI_KEY) return null;
  if (!clientPromise) {
    clientPromise = import("openai").then(({ default: OpenAI }) => new OpenAI({ apiKey: OPENAI_KEY }));
  }
  return clientPromise;
}

/** Unified OpenAI chat completion with graceful mock fallback. */
export async function aiComplete(options: AiCompletionOptions): Promise<AiCompletionResult> {
  const client = await getOpenAiClient();
  if (!client) {
    return { content: mockCompletion(options), source: "mock" };
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
      response_format: options.json ? { type: "json_object" } : undefined,
      max_tokens: options.maxTokens ?? 800,
      temperature: options.temperature ?? 0.4,
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (content) return { content, source: "openai" };
  } catch {
    // fall through to mock
  }

  return { content: mockCompletion(options), source: "mock" };
}

function mockCompletion(options: AiCompletionOptions): string {
  if (options.json) {
    return JSON.stringify({
      reply:
        "Community Connect AI is running in demo mode. Set OPENAI_API_KEY for full responses.",
      suggestions: ["Browse marketplace", "Check local alerts", "See tonight's events"],
    });
  }
  return "Community Connect AI (demo mode): I can help with community feed, marketplace, events, safety alerts, HOA, and local businesses. Set OPENAI_API_KEY for live answers.";
}

export { safeParseJson } from "@/lib/ai/json-utils";

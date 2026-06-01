import "server-only";
import { prisma } from "@/lib/prisma";
import { aiComplete, safeParseJson, type AiSource } from "@/lib/ai/core";
import type { ModerationEntityType } from "@prisma/client";

export interface ModerationScanInput {
  entityType: ModerationEntityType;
  entityId: string;
  content: string;
  communityId?: string;
  reporterId?: string;
}

export interface ModerationScanResult {
  flagged: boolean;
  categories: string[];
  confidence: number;
  summary: string;
  caseId?: string;
  source: AiSource;
}

const SPAM_PATTERNS = [
  /click here now/i,
  /free money/i,
  /crypto giveaway/i,
  /dm me for/i,
  /whatsapp only/i,
];

const SCAM_PATTERNS = [/wire transfer/i, /gift card/i, /send payment first/i, /western union/i];

const HARASSMENT_PATTERNS = [/kill yourself/i, /you're stupid/i, /hate you/i];

export async function scanContent(input: ModerationScanInput): Promise<ModerationScanResult> {
  const heuristic = heuristicScan(input.content);
  const aiResult = await aiModerationScan(input.content);
  const flagged = heuristic.flagged || aiResult.flagged;
  const categories = [...new Set([...heuristic.categories, ...aiResult.categories])];
  const confidence = Math.max(heuristic.confidence, aiResult.confidence);

  let caseId: string | undefined;
  if (flagged && confidence >= 0.55) {
    caseId = await createModerationCase({
      entityType: input.entityType,
      entityId: input.entityId,
      communityId: input.communityId,
      reporterId: input.reporterId,
      aiConfidence: confidence,
      summary: aiResult.summary || heuristic.summary,
    });
  }

  return {
    flagged,
    categories,
    confidence,
    summary: aiResult.summary || heuristic.summary,
    caseId,
    source: aiResult.source,
  };
}

function heuristicScan(content: string): Omit<ModerationScanResult, "caseId" | "source"> {
  const categories: string[] = [];
  let confidence = 0;

  if (SPAM_PATTERNS.some((p) => p.test(content))) {
    categories.push("spam");
    confidence = Math.max(confidence, 0.7);
  }
  if (SCAM_PATTERNS.some((p) => p.test(content))) {
    categories.push("scam");
    confidence = Math.max(confidence, 0.75);
  }
  if (HARASSMENT_PATTERNS.some((p) => p.test(content))) {
    categories.push("harassment");
    confidence = Math.max(confidence, 0.8);
  }

  return {
    flagged: categories.length > 0,
    categories,
    confidence,
    summary: categories.length
      ? `Heuristic match: ${categories.join(", ")}`
      : "No policy violations detected",
  };
}

async function aiModerationScan(content: string): Promise<ModerationScanResult & { source: AiSource }> {
  const { content: raw, source } = await aiComplete({
    system: `Classify UGC for spam, scam, harassment. JSON: flagged (bool), categories (string[]), confidence (0-1), summary (string). Never recommend auto-delete.`,
    user: content.slice(0, 2000),
    json: true,
    maxTokens: 300,
  });

  const parsed = safeParseJson<{
    flagged?: boolean;
    categories?: string[];
    confidence?: number;
    summary?: string;
  }>(raw, { flagged: false, categories: [], confidence: 0, summary: "AI scan unavailable" });

  return {
    flagged: Boolean(parsed.flagged),
    categories: parsed.categories ?? [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    summary: parsed.summary ?? "AI moderation scan",
    source,
  };
}

/** Creates human-review queue entry — never auto-deletes content. */
async function createModerationCase(input: {
  entityType: ModerationEntityType;
  entityId: string;
  communityId?: string;
  reporterId?: string;
  aiConfidence: number;
  summary: string;
}): Promise<string | undefined> {
  try {
    const existing = await prisma.moderationCase.findFirst({
      where: { entityType: input.entityType, entityId: input.entityId, status: "OPEN" },
    });
    if (existing) return existing.id;

    const created = await prisma.moderationCase.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        communityId: input.communityId,
        reporterId: input.reporterId,
        aiConfidence: input.aiConfidence,
        status: "OPEN",
        internalNotes: `[AI] ${input.summary}`,
      },
    });
    return created.id;
  } catch {
    return `mock-case-${input.entityId}`;
  }
}

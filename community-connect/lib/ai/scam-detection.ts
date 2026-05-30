/** Phase 6 placeholder — heuristic scam signals for listing review. */
export interface ScamCheckResult {
  risk: "low" | "medium" | "high";
  flags: string[];
}

const SUSPICIOUS = [
  "wire transfer",
  "western union",
  "gift card",
  "send money first",
  "overseas shipping only",
  "too good to be true",
];

export function checkListingScamRisk(title: string, description?: string): ScamCheckResult {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const flags = SUSPICIOUS.filter((p) => text.includes(p));
  if (flags.length >= 2) return { risk: "high", flags };
  if (flags.length === 1) return { risk: "medium", flags };
  return { risk: "low", flags: [] };
}

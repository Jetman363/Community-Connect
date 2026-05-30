import type { IncidentCategory } from "@prisma/client";

export interface CategorizationResult {
  suggestedCategory: IncidentCategory;
  confidence: number;
  source: "stub";
}

/** Phase 4 stub — wire to LLM/ML in Phase 5+. */
export async function suggestIncidentCategory(
  title: string,
  description: string
): Promise<CategorizationResult> {
  const text = `${title} ${description}`.toLowerCase();
  let suggested: IncidentCategory = "OTHER";
  if (/crime|theft|robbery|assault|vandal/i.test(text)) suggested = "CRIME";
  else if (/noise|loud|party|music/i.test(text)) suggested = "NOISE";
  else if (/pothole|repair|broken|maintenance|leak/i.test(text)) suggested = "MAINTENANCE";
  else if (/traffic|parking|speed|road/i.test(text)) suggested = "TRAFFIC";
  else if (/hazard|danger|unsafe|fallen|wire/i.test(text)) suggested = "HAZARD";
  else if (/trash|pollution|environment/i.test(text)) suggested = "ENVIRONMENTAL";

  return { suggestedCategory: suggested, confidence: 0.6, source: "stub" };
}

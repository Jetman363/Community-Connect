import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function chatCompletion(
  messages: { role: "user" | "assistant" | "system"; content: string }[]
): Promise<string> {
  if (!openai) {
    const last = messages.filter((m) => m.role === "user").pop();
    return mockAssistantReply(last?.content ?? "");
  }

  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are Community Connect AI, a helpful assistant for local community engagement, public safety, events, and services. Be concise and actionable.",
      },
      ...messages,
    ],
    max_tokens: 500,
  });

  return res.choices[0]?.message?.content ?? "I could not generate a response.";
}

export async function categorizeReport(
  title: string,
  description: string
): Promise<string> {
  if (!openai) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes("noise")) return "Noise Complaint";
    if (text.includes("pothole") || text.includes("road")) return "Infrastructure";
    if (text.includes("suspicious") || text.includes("theft")) return "Public Safety";
    if (text.includes("trash")) return "Sanitation";
    return "General Community Issue";
  }

  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Classify community reports into one short category label (2-4 words). Reply with only the category name.",
      },
      { role: "user", content: `Title: ${title}\nDescription: ${description}` },
    ],
    max_tokens: 20,
  });

  return res.choices[0]?.message?.content?.trim() ?? "Uncategorized";
}

function mockAssistantReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("alert") || q.includes("safety"))
    return "Check the Alerts tab for active safety notifications. You can also report incidents from the Reporting center with GPS and photos.";
  if (q.includes("event"))
    return "Browse upcoming community events on the Events page. You can RSVP and create new events when signed in.";
  if (q.includes("hoa"))
    return "HOA announcements, documents, and community votes are available under HOA Management in your dashboard.";
  return "I'm running in demo mode (no OpenAI API key). I can help with safety alerts, local services, events, reporting issues, and marketplace listings. What do you need today?";
}

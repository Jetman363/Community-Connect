"use client";

import { useState, useRef, useEffect } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const suggestedPrompts = [
  "What's the latest safety alert in my area?",
  "Show me upcoming community events",
  "How do I report a pothole or hazard?",
  "Find highly rated local services",
  "What are the HOA rules for parking?",
  "Help me write a neighborhood post",
];

const mockResponses: Record<string, string> = {
  alert:
    "There's currently a Flash Flood Warning for Oak Hills until 6 PM today. I also see a vehicle break-in advisory on Elm Street. Check the Alerts page for full details and map locations.",
  event:
    "You have 5 upcoming events: Summer Block Party (Jun 14), Neighborhood Watch Meeting (Jun 5), Trail Cleanup (Jun 7), Kids Movie Night (Jun 21), and Community 5K (Jun 28). You're RSVP'd for the block party and movie night!",
  report:
    "To report a non-emergency issue: 1) Tap the red Report button in the header, 2) Choose a category (hazard, crime, maintenance, etc.), 3) Add details and location. For emergencies, always call 911 first.",
  service:
    "Top-rated nearby services: Oak Street Bakery (4.8★), Green Thumb Landscaping (4.6★), Oak Hills Veterinary (4.9★). Visit the Services page to see hours, contact info, and reviews.",
  hoa: "Key HOA reminders: street parking restrictions during farmers market, pool maintenance May 30–31, and two active votes on playground equipment and EV charging stations. Check the HOA portal for documents.",
  post:
    "Here's a draft post: 'Hi neighbors! Looking to organize a weekend dog walk group. Meet at Oak Hills Park Saturdays at 9 AM. Reply if interested!' — Feel free to edit before posting.",
  default:
    "I'm your Community Connect assistant. I can help with safety alerts, events, local services, HOA info, and reporting issues. Try one of the suggested prompts below!",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("alert") || lower.includes("safety")) return mockResponses.alert;
  if (lower.includes("event")) return mockResponses.event;
  if (lower.includes("report") || lower.includes("hazard") || lower.includes("pothole"))
    return mockResponses.report;
  if (lower.includes("service") || lower.includes("business") || lower.includes("rated"))
    return mockResponses.service;
  if (lower.includes("hoa") || lower.includes("parking")) return mockResponses.hoa;
  if (lower.includes("post") || lower.includes("write")) return mockResponses.post;
  return mockResponses.default;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your Community Connect AI assistant. Ask me about alerts, events, services, HOA info, or how to use the platform.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: getResponse(text) }]);
      setTyping(false);
    }, 800);
  };

  return (
    <PageTransition>
      <PageHeader
        title="AI Assistant"
        description="Community-aware help for questions, navigation, and local info"
        action={
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            Powered by mock AI (Phase 2)
          </div>
        }
      />

      <div className="mx-auto flex max-w-3xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex max-h-[calc(100vh-20rem)] min-h-[400px] flex-col gap-4 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15">
                  <Bot className="h-4 w-4 text-[var(--accent)]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]"
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15">
                <Bot className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <div className="rounded-2xl bg-[var(--muted)] px-4 py-3">
                <span className="inline-flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="h-2 w-2 rounded-full bg-[var(--muted-foreground)]"
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--muted)]"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask anything about your community..."
              className="flex-1"
            />
            <Button size="icon" onClick={() => send(input)} disabled={typing}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

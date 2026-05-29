"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Mic, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const suggestedPrompts = [
  { icon: "🚨", text: "What's the latest safety alert?" },
  { icon: "📅", text: "Events happening this weekend" },
  { icon: "🏪", text: "Find a plumber near me" },
  { icon: "📝", text: "How do I report an issue?" },
  { icon: "🐕", text: "Report a lost pet" },
  { icon: "🗺️", text: "Show me the community map" },
];

const quickActions = [
  { label: "Report Issue", href: "/report" },
  { label: "View Alerts", href: "/alerts" },
  { label: "Browse Events", href: "/events" },
  { label: "Find Services", href: "/services" },
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! I'm your Community Connect AI assistant. I can help you find local services, check alerts, discover events, and navigate the platform. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "assistant",
        text: getMockResponse(text),
      },
    ]);
    setInput("");
  };

  return (
    <PageTransition>
      <PageHeader
        title="AI Assistant"
        description="Community-aware help for questions, reports, and navigation"
        action={
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Compact" : "Expanded"}
          </Button>
        }
      />

      <div
        className={cn(
          "mx-auto flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm",
          expanded ? "h-[calc(100vh-10rem)] max-w-4xl" : "max-w-2xl"
        )}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Bot className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-medium">Community Assistant</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Powered by AI · Phase 2 demo mode
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--muted)]"
                )}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {messages.length <= 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Suggested prompts
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => send(p.text)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--muted)]"
                  >
                    <span>{p.icon}</span>
                    {p.text}
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((a) => (
                  <a
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-4 py-2 text-sm hover:bg-[var(--border)]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {a.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border)] p-4">
          <Button variant="ghost" size="icon" aria-label="Voice input">
            <Mic className="h-4 w-4 text-[var(--muted-foreground)]" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask me anything about your community..."
            className="flex-1"
          />
          <Button size="icon" onClick={() => send(input)}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("alert") || lower.includes("safety"))
    return "There are 2 active alerts in Oak Hills: a severe wind advisory and a road closure on Oak Ave. Check the Alerts page for details and the live map.";
  if (lower.includes("event") || lower.includes("weekend"))
    return "This weekend: Farmers Market on Saturday at Town Square (124 going), and Youth Soccer Tournament on Sunday at Riverside Fields.";
  if (lower.includes("plumber") || lower.includes("service"))
    return "I found Green Thumb Landscaping (4.5★, 1.2 mi) for home services. For plumbing specifically, check the Services directory — Phase 3 will add smart matching.";
  if (lower.includes("report"))
    return "You can submit reports via the Report button in the header, or visit /report. Choose a category (hazard, crime, maintenance) and add photos if available.";
  if (lower.includes("lost") || lower.includes("pet"))
    return "There's an active lost pet post for Buddy, a golden retriever last seen near Cedar Park. Would you like me to help you create a lost pet alert?";
  if (lower.includes("map"))
    return "The community map shows alerts, events, businesses, and reports. Visit the Map page — full Google Maps integration arrives in Phase 3.";
  return "I'm running in demo mode for Phase 2. I can help with alerts, events, services, and navigation once fully connected in Phase 3. Try one of the suggested prompts!";
}

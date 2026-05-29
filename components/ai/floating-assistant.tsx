"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Mic, Send, Maximize2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const suggestedPrompts = [
  "What's happening nearby?",
  "Report a pothole",
  "Find a dog walker",
  "Upcoming events this week",
];

const quickReplies = [
  { role: "assistant" as const, text: "Hi Alex! I'm your Community Connect assistant. How can I help you today?" },
];

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(quickReplies);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user" as const, text },
      {
        role: "assistant" as const,
        text: "I'm a demo assistant in Phase 2. Full AI integration arrives in Phase 3!",
      },
    ]);
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl md:bottom-6"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
                  <Bot className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <span className="font-medium text-sm">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/assistant">
                  <Button variant="ghost" size="icon" aria-label="Expand">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex max-h-64 flex-col gap-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "ml-auto bg-[var(--accent)] text-white"
                      : "bg-[var(--muted)]"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs hover:bg-[var(--border)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
              <Button variant="ghost" size="icon" aria-label="Voice input">
                <Mic className="h-4 w-4 text-[var(--muted-foreground)]" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask anything..."
                className="flex-1"
              />
              <Button size="icon" onClick={() => send(input)} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg md:bottom-6"
        aria-label="Open AI assistant"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </motion.button>
    </>
  );
}

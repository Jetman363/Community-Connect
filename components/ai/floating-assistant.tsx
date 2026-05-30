"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Mic, Send, Maximize2, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { QUICK_PROMPTS } from "@/lib/ai/prompts";
import { useToast } from "@/components/ui/toast";

type ChatMessage = { role: "assistant" | "user"; text: string };

export function FloatingAssistant() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I'm your Community Connect assistant — marketplace, events, safety, HOA, and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(
    QUICK_PROMPTS.slice(0, 4).map((p) => p.label)
  );

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const userText = text.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setSending(true);
    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.text,
      }));
      const res = await apiFetch<{
        reply: string;
        suggestions?: string[];
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: userText, history }),
      });
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
      if (res.suggestions?.length) setSuggestions(res.suggestions);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Sign in to use the full AI assistant, or set OPENAI_API_KEY for live responses.",
        },
      ]);
      toast("AI assistant unavailable", "error");
    } finally {
      setSending(false);
    }
  };

  const panelHeight = expanded ? "max-h-[min(70vh,520px)]" : "max-h-64";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 shadow-2xl backdrop-blur-xl md:bottom-6 ${
              expanded ? "max-w-md" : "max-w-sm"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
                  <Bot className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <span className="font-medium text-sm">Community AI</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? "Collapse" : "Expand panel"}
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
                <Link href="/assistant">
                  <Button variant="ghost" size="icon" aria-label="Full assistant">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className={`flex flex-col gap-3 overflow-y-auto p-4 ${panelHeight}`}>
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
            {expanded && (
              <div className="max-h-32 overflow-y-auto border-t border-[var(--border)] px-3 py-2">
                <p className="mb-2 text-[10px] font-medium uppercase text-[var(--muted-foreground)]">
                  All domains
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={sending}
                      onClick={() => void send(p.prompt)}
                      className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-[11px] hover:bg-[var(--border)]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.length <= 2 && !expanded && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {suggestions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={sending}
                    onClick={() => void send(p)}
                    className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs hover:bg-[var(--border)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
              <Button variant="ghost" size="icon" aria-label="Voice input (coming soon)">
                <Mic className="h-4 w-4 text-[var(--muted-foreground)]" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void send(input)}
                placeholder="Ask anything..."
                className="flex-1"
                disabled={sending}
              />
              <Button size="icon" onClick={() => void send(input)} disabled={sending} aria-label="Send">
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

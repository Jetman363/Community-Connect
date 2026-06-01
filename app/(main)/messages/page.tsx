"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockConversations, getUserById } from "@/lib/mock-data";
import { RelativeTime } from "@/components/ui/relative-time";
import { cn } from "@/lib/utils";
import { Search, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(mockConversations[0]?.id);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(
    mockConversations.find((c) => c.id === activeId)?.messages ?? []
  );

  const active = mockConversations.find((c) => c.id === activeId);
  const participant = active ? getUserById(active.participantIds[0]) : null;

  const selectConversation = (id: string) => {
    setActiveId(id);
    const conv = mockConversations.find((c) => c.id === id);
    setMessages(conv?.messages ?? []);
  };

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      {
        id: `new-${Date.now()}`,
        senderId: "demo-resident",
        content: input,
        createdAt: new Date().toISOString(),
        read: true,
      },
    ]);
    setInput("");
  };

  return (
    <PageTransition>
      <PageHeader title="Messages" description="Chat with neighbors and community members" />

      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {/* Conversation list */}
        <div className="hidden w-80 shrink-0 flex-col border-r border-[var(--border)] md:flex">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input placeholder="Search messages..." className="pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conv) => {
              const user = getUserById(conv.participantIds[0]);
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--muted)]",
                    activeId === conv.id && "bg-[var(--accent)]/5"
                  )}
                >
                  <Avatar initials={user?.avatar ?? "?"} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{user?.displayName}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        <RelativeTime date={conv.lastMessageAt} />
                      </span>
                    </div>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                      {conv.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {participant ? (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                <Avatar initials={participant.avatar} verified={participant.verified} />
                <div>
                  <p className="font-medium text-sm">{participant.displayName}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Active recently</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => {
                  const isMe = msg.senderId === "demo-resident";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex", isMe ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                          isMe
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--muted)]"
                        )}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button size="icon" onClick={send}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[var(--muted-foreground)]">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

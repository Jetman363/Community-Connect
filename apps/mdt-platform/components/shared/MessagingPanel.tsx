"use client";

import { useState } from "react";
import clsx from "clsx";
import { MessageSquare, Send, Zap } from "lucide-react";
import { sendDemoMessage } from "@/lib/demo-api";
import { useAuth } from "@/lib/auth-context";
import type { DemoMessage } from "@/lib/types";

const QUICK_REPLIES: Record<string, string[]> = {
  dispatcher: ["10-4", "Copy", "En route to your location", "Additional units dispatched"],
  officer: ["10-4", "On scene", "Request backup", "Code 4 — all clear"],
  supervisor: ["Monitoring", "Approved", "Hold position", "Escalating to command"],
  calltaker: ["Stay on the line", "Help is on the way", "Are you in a safe location?"],
};

export function MessagingPanel({
  messages, incidentId, recipientRole, variant = "default",
}: {
  messages: DemoMessage[];
  incidentId?: string;
  recipientRole?: string;
  variant?: "default" | "vehicle";
}) {
  const vehicle = variant === "vehicle";
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const filtered = incidentId
    ? messages.filter((m) => !m.incident_id || m.incident_id === incidentId)
    : messages;
  const quick = user ? QUICK_REPLIES[user.role] ?? QUICK_REPLIES.dispatcher : [];

  const send = async (msg: string, priority = "normal") => {
    if (!user || !msg.trim()) return;
    setSending(true);
    try {
      await sendDemoMessage({
        sender_id: user.id, sender_role: user.role, message: msg.trim(),
        priority, incident_id: incidentId, recipient_role: recipientRole,
      });
      setText("");
    } catch { /* offline */ }
    setSending(false);
  };

  return (
    <div className="tactical-panel flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b mdt-comms-divider flex items-center gap-2">
        <MessageSquare className="w-4 h-4 mdt-comms-meta" />
        <span className="text-xs uppercase tracking-wider mdt-comms-meta">Live Comms</span>
      </div>
      <div className={clsx("flex-1 overflow-y-auto space-y-2", vehicle ? "p-3" : "p-2 space-y-1.5")}>
        {filtered.slice(0, 30).map((m) => (
          <div
            key={m.id}
            className={clsx(
              "rounded mdt-comms-message",
              vehicle ? "p-3 text-sm" : "p-2 text-xs",
              m.priority === "emergency" && "mdt-comms-message--emergency",
              m.sender_id === user?.id && m.priority !== "emergency" && "mdt-comms-message--own",
            )}
          >
            <div className="flex justify-between mb-0.5 gap-2">
              <span className="mdt-comms-sender capitalize">{m.sender_role}</span>
              <span className="mdt-comms-meta font-mono shrink-0">
                {new Date(m.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p>{m.message}</p>
          </div>
        ))}
        {!filtered.length && (
          <p className="text-xs mdt-comms-empty text-center py-4">No messages</p>
        )}
      </div>
      <div className={clsx("border-t mdt-comms-divider space-y-2", vehicle ? "p-3 space-y-3" : "p-2")}>
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className={clsx(
                "rounded transition-colors mdt-comms-quick touch-manipulation",
                vehicle ? "mdt-vehicle-btn-sm text-sm" : "text-[10px] px-2 py-0.5",
              )}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(text)}
            placeholder="Type message..."
            className={clsx(
              "flex-1 rounded mdt-comms-input",
              vehicle ? "px-3 py-3 text-base min-h-[48px]" : "px-2 py-1.5 text-xs",
            )}
          />
          <button
            type="button"
            onClick={() => send(text)}
            disabled={sending}
            className={clsx(
              "bg-blue-600 rounded-xl hover:bg-blue-500 text-white disabled:opacity-50 touch-manipulation",
              vehicle ? "mdt-vehicle-btn-sm px-4" : "p-1.5 rounded",
            )}
          >
            <Send className={vehicle ? "w-5 h-5" : "w-4 h-4"} />
          </button>
          <button
            type="button"
            onClick={() => send("EMERGENCY — IMMEDIATE ASSISTANCE", "emergency")}
            className={clsx(
              "bg-red-600 rounded-xl hover:bg-red-500 text-white touch-manipulation",
              vehicle ? "mdt-vehicle-btn-sm px-4" : "p-1.5 rounded",
            )}
            title="Emergency"
          >
            <Zap className={vehicle ? "w-5 h-5" : "w-4 h-4"} />
          </button>
        </div>
      </div>
    </div>
  );
}

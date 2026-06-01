"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendBusinessInquiry, sendListingInquiry, apiFetch } from "@/lib/api/client";

export function InquiryForm({
  businessId,
  listingId,
  jobId,
  quoteRequest = false,
  onSent,
}: {
  businessId?: string;
  listingId?: string;
  jobId?: string;
  quoteRequest?: boolean;
  onSent?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (message.trim().length < 10) {
      setError("Message must be at least 10 characters");
      return;
    }
    setSending(true);
    setError(null);
    try {
      if (businessId) {
        await sendBusinessInquiry(businessId, message.trim(), quoteRequest);
      } else if (listingId) {
        await sendListingInquiry(listingId, message.trim());
      } else if (jobId) {
        await apiFetch(`/api/jobs/${jobId}/apply`, {
          method: "POST",
          body: JSON.stringify({ message: message.trim() }),
        });
      }
      setSent(true);
      setMessage("");
      onSent?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700">
        Message sent! The business will respond soon.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder={quoteRequest ? "Describe what you need a quote for..." : "Your message..."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button className="w-full" onClick={submit} disabled={sending}>
        {sending ? "Sending..." : quoteRequest ? "Request quote" : "Send message"}
      </Button>
    </div>
  );
}

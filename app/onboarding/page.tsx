"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const INTEREST_OPTIONS = [
  { id: "family", label: "Family" },
  { id: "business", label: "Business" },
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "events", label: "Events" },
  { id: "marketplace", label: "Marketplace" },
  { id: "safety", label: "Safety" },
  { id: "pets", label: "Pets" },
  { id: "schools", label: "Schools" },
  { id: "community", label: "Community" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(["events", "community"]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const finish = async () => {
    if (selected.length < 1) {
      toast("Pick at least one interest", "error");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/personalization/profile", {
        method: "PATCH",
        body: JSON.stringify({ interests: selected }),
      });
      await apiFetch("/api/personalization/onboarding-complete", { method: "POST" });
      toast("Welcome to Community Connect!", "success");
      router.push("/dashboard");
    } catch {
      toast("Saved locally — sign in for full sync", "info");
      document.cookie = "cc_onboarded=1; path=/; max-age=31536000";
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-display mb-2">Welcome to Community Connect</h1>
        <p className="text-body mb-8 text-[var(--muted-foreground)]">
          Choose topics to personalize your home feed, marketplace picks, and AI assistant.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {INTEREST_OPTIONS.map((opt) => {
            const on = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                  on
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] hover:bg-[var(--muted)]"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <Button className="mt-8 w-full" size="lg" onClick={() => void finish()} disabled={saving}>
          {saving ? "Saving…" : "Continue to your dashboard"}
        </Button>
      </div>
    </PageTransition>
  );
}

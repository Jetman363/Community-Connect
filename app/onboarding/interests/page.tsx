"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { RADIUS_INTERESTS } from "@/config/interests";

export default function OnboardingInterestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(["events", "deals"]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const continueNext = async () => {
    if (selected.length < 1) {
      toast("Pick at least one interest", "error");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/personalization/interests", {
        method: "POST",
        body: JSON.stringify({ interests: selected }),
      });
      router.push("/onboarding/profile");
    } catch {
      toast("Saved locally", "info");
      router.push("/onboarding/profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">What interests you?</h2>
      <p className="text-body mb-8 text-[var(--muted-foreground)]">
        Radius will personalize your home feed, deals, and recommendations.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {RADIUS_INTERESTS.map((opt) => {
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

      <Button className="mt-8 w-full" size="lg" onClick={() => void continueNext()} disabled={saving}>
        {saving ? "Saving…" : "Continue"}
      </Button>
      <button
        type="button"
        onClick={() => router.push("/onboarding/profile")}
        className="mt-3 w-full text-center text-sm text-[var(--muted-foreground)] hover:underline"
      >
        Skip
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

const STEPS = [
  { key: "org", title: "Organization setup", description: "Name, slug, and tier" },
  { key: "branding", title: "Branding", description: "Logo, colors, custom domain" },
  { key: "roles", title: "Roles & permissions", description: "RBAC assignments" },
  { key: "integrations", title: "Integrations", description: "Enable CAD, RMS, smart city connectors" },
  { key: "deploy", title: "Deploy config", description: "Environment and gateway keys" },
];

export default function OnboardingPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set(["org"]));

  const toggle = (key: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const progress = Math.round((completed.size / STEPS.length) * 100);

  return (
    <PageTransition>
      <PageHeader
        title="Enterprise Onboarding"
        description="White-label setup wizard for new agency tenants"
      />

      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--muted)]">
          <div
            className="h-2 rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const done = completed.has(step.key);
          return (
            <div
              key={step.key}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{step.title}</p>
                  <Badge variant="accent">Step {i + 1}</Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{step.description}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggle(step.key)}>
                {done ? "Undo" : "Complete"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
        Visual workflow builder UI planned for V2.0 — configure automations at{" "}
        <a href="/admin/agency" className="underline">Agency Config</a>.
      </p>
    </PageTransition>
  );
}

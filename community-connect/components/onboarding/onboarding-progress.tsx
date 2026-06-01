"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/onboarding/location", label: "Location" },
  { href: "/onboarding/interests", label: "Interests" },
  { href: "/onboarding/profile", label: "Profile" },
] as const;

export function OnboardingProgress() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex(
    (s) => pathname === s.href || pathname.startsWith(`${s.href}/`)
  );
  const active = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>Radius setup</span>
        <span>
          Step {active + 1} of {STEPS.length}
        </span>
      </div>
      <div className="flex gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step.href}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= active ? "bg-[var(--accent)]" : "bg-[var(--muted)]"
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs">
        {STEPS.map((step, i) => (
          <Link
            key={step.href}
            href={step.href}
            className={cn(
              i <= active ? "text-[var(--accent)] font-medium" : "text-[var(--muted-foreground)]"
            )}
          >
            {step.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

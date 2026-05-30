"use client";

import { Shield, MapPin, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrustPanel({ onReport }: { onReport?: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-[var(--accent)]" />
        Safe Trading Tips
      </div>
      <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
        <li>Meet in a public place — see suggested locations below</li>
        <li>Inspect items before paying</li>
        <li>Use in-app messaging when possible</li>
      </ul>
      <div className="flex items-start gap-2 rounded-lg bg-[var(--card)] p-3 text-xs">
        <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" />
        <div>
          <p className="font-medium">Suggested meetup</p>
          <p className="text-[var(--muted-foreground)]">
            Oak Hills Community Center parking lot — well-lit, security cameras
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1 text-xs"
        onClick={onReport}
      >
        <Flag className="h-3.5 w-3.5" />
        Report listing / scam
      </Button>
    </div>
  );
}

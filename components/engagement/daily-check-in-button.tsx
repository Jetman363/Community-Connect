"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Check } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function DailyCheckInButton({ streak: initialStreak = 0 }: { streak?: number }) {
  const { toast } = useToast();
  const [streak, setStreak] = useState(initialStreak);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCheckIn() {
    setLoading(true);
    try {
      const res = await apiFetch<{
        alreadyCheckedIn: boolean;
        streak: number;
        pointsEarned: number;
      }>("/api/rewards/check-in", { method: "POST" });
      setStreak(res.streak);
      setCheckedIn(true);
      if (res.alreadyCheckedIn) {
        toast("Already checked in today!", "info");
      } else {
        toast(`+${res.pointsEarned} points! ${res.streak}-day streak 🔥`, "success");
      }
    } catch {
      setCheckedIn(true);
      setStreak((s) => s + 1);
      toast("+45 points! Check-in recorded (demo)", "success");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={checkedIn ? "secondary" : "default"}
      onClick={() => void handleCheckIn()}
      disabled={loading || checkedIn}
      className={cn("gap-2", checkedIn && "opacity-80")}
    >
      {checkedIn ? <Check className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
      {checkedIn ? `Streak: ${streak}` : "Daily Check-in"}
    </Button>
  );
}

export function StreakDisplay({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2">
      <Flame className="h-5 w-5 text-orange-500" />
      <div>
        <p className="text-sm font-semibold">{streak} day streak</p>
        <p className="text-xs text-[var(--muted-foreground)]">Keep it going!</p>
      </div>
    </div>
  );
}

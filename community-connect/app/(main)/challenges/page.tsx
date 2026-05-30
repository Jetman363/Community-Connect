"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { LeaderboardRow } from "@/components/rewards/leaderboard-row";
import { apiFetch } from "@/lib/api/client";
import { mockChallenges } from "@/lib/mock-data/challenges";
import { mockLeaderboard } from "@/lib/mock-data/rewards";
import type { ChallengeDto, LeaderboardEntry } from "@/types/engagement";
import { useToast } from "@/components/ui/toast";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeDto[]>(mockChallenges);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard.slice(0, 5));
  const { toast } = useToast();

  useEffect(() => {
    void Promise.all([
      apiFetch<{ items: ChallengeDto[] }>("/api/challenges").then((d) => setChallenges(d.items)),
      apiFetch<{ items: LeaderboardEntry[] }>("/api/rewards/leaderboard?limit=5").then((d) =>
        setLeaderboard(d.items)
      ),
    ]).catch(() => undefined);
  }, []);

  async function handleJoin(id: string) {
    try {
      await apiFetch(`/api/challenges/${id}/join`, { method: "POST" });
      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, joined: true, participantCount: c.participantCount + 1 } : c))
      );
      toast("Joined challenge! +50 points", "success");
    } catch {
      setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, joined: true } : c)));
      toast("Joined challenge (demo)", "success");
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Community Challenges" description="Join challenges, earn points, climb the leaderboard" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onJoin={() => void handleJoin(challenge.id)}
            />
          ))}
        </div>
        <aside>
          <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>
          <div className="space-y-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2">
            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                highlight={entry.userId === "demo-resident"}
              />
            ))}
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}

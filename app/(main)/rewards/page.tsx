"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { PointsBadge } from "@/components/rewards/points-badge";
import { AchievementBadge } from "@/components/rewards/achievement-badge";
import { LeaderboardRow } from "@/components/rewards/leaderboard-row";
import { StreakDisplay, DailyCheckInButton } from "@/components/engagement/daily-check-in-button";
import { apiFetch } from "@/lib/api/client";
import { mockPoints, mockAchievements, mockLeaderboard } from "@/lib/mock-data/rewards";
import type { AchievementDto, LeaderboardEntry, PointsDto } from "@/types/engagement";

export default function RewardsPage() {
  const [points, setPoints] = useState<PointsDto>(mockPoints);
  const [achievements, setAchievements] = useState<AchievementDto[]>(mockAchievements);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard);

  useEffect(() => {
    void Promise.all([
      apiFetch<PointsDto>("/api/rewards/points").then(setPoints),
      apiFetch<{ items: AchievementDto[] }>("/api/rewards/achievements").then((d) =>
        setAchievements(d.items)
      ),
      apiFetch<{ items: LeaderboardEntry[] }>("/api/rewards/leaderboard").then((d) =>
        setLeaderboard(d.items)
      ),
    ]).catch(() => undefined);
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Rewards"
        description="Earn points, unlock badges, and compete on the community leaderboard"
        action={<DailyCheckInButton streak={points.streak} />}
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <PointsBadge points={points} />
        <StreakDisplay streak={points.streak} />
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Achievements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2">
          {leaderboard.map((entry) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              highlight={entry.userId === "demo-resident"}
            />
          ))}
        </div>
      </section>
    </PageTransition>
  );
}

"use client";

import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target } from "lucide-react";
import type { ChallengeDto } from "@/types/engagement";
import { ChallengeProgressBar } from "./progress-bar";

export function ChallengeCard({
  challenge,
  onJoin,
}: {
  challenge: ChallengeDto;
  onJoin?: () => void;
}) {
  const progressPct = challenge.joined
    ? Math.min(100, ((challenge.progress ?? 0) / challenge.milestone) * 100)
    : 0;

  return (
    <motion.div whileHover={{ y: -2 }}>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {challenge.imageUrl && (
          <div className="relative h-32">
            <CommunityImage src={challenge.imageUrl} alt={challenge.title} fill sizes="400px" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold">{challenge.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
            {challenge.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {challenge.participantCount} joined
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              Goal: {challenge.milestone}
            </span>
          </div>
          {challenge.joined && (
            <div className="mt-3">
              <ChallengeProgressBar value={progressPct} label={`${challenge.progress ?? 0}/${challenge.milestone}`} />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <Badge variant="default">
              Ends {new Date(challenge.endDate).toLocaleDateString()}
            </Badge>
            {!challenge.joined && onJoin && (
              <Button size="sm" onClick={onJoin}>
                Join Challenge
              </Button>
            )}
            {challenge.joined && (
              <Badge variant="accent">Joined</Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

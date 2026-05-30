"use client";

import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock } from "lucide-react";
import type { GroupDto } from "@/types/engagement";

export function GroupHeader({
  group,
  onJoin,
  onLeave,
  loading,
}: {
  group: GroupDto;
  onJoin?: () => void;
  onLeave?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="relative h-40 md:h-48">
        {group.coverPhoto ? (
          <CommunityImage src={group.coverPhoto} alt={group.name} fill sizes="800px" />
        ) : (
          <div className="h-full bg-[var(--muted)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 text-white">{group.category}</Badge>
            {group.isPrivate && (
              <Badge className="bg-white/20 text-white">
                <Lock className="mr-1 h-3 w-3" /> Private
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{group.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
            <Users className="h-4 w-4" />
            {group.memberCount} members
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 p-4">
        <p className="text-sm text-[var(--muted-foreground)]">{group.description}</p>
        {group.isMember ? (
          <Button variant="outline" size="sm" onClick={onLeave} disabled={loading}>
            Leave
          </Button>
        ) : (
          <Button size="sm" onClick={onJoin} disabled={loading}>
            Join Group
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import { Users, Lock } from "lucide-react";
import type { GroupDto } from "@/types/engagement";

export function GroupCard({ group }: { group: GroupDto }) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Link
        href={`/groups/${group.id}`}
        className="block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
      >
        <div className="relative h-28">
          {group.coverPhoto ? (
            <CommunityImage src={group.coverPhoto} alt={group.name} fill sizes="300px" />
          ) : (
            <div className="h-full bg-[var(--muted)]" />
          )}
          {group.isPrivate && (
            <Badge className="absolute right-2 top-2 bg-black/50 text-white">
              <Lock className="mr-1 h-3 w-3" /> Private
            </Badge>
          )}
        </div>
        <div className="p-4">
          <Badge variant="default" className="mb-2">
            {group.category}
          </Badge>
          <h3 className="font-semibold">{group.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Users className="h-3.5 w-3.5" />
            {group.memberCount} members
          </p>
          {group.isMember && (
            <Badge variant="accent" className="mt-2">
              Joined
            </Badge>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

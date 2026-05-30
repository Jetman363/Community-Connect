"use client";

import { motion } from "framer-motion";
import { CommunityImage } from "@/components/ui/community-image";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import type { FamilyActivityDto } from "@/types/engagement";

const categoryLabels: Record<string, string> = {
  school: "School",
  sports: "Sports",
  camp: "Camp",
  family: "Family",
};

export function FamilyActivityCard({ activity }: { activity: FamilyActivityDto }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="min-w-[240px] shrink-0 snap-start">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {activity.imageUrl && (
          <div className="relative h-28">
            <CommunityImage src={activity.imageUrl} alt={activity.title} fill sizes="240px" />
          </div>
        )}
        <div className="p-4">
          <Badge variant="default" className="mb-2">
            {categoryLabels[activity.category] ?? activity.category}
          </Badge>
          <h3 className="line-clamp-2 font-semibold text-sm">{activity.title}</h3>
          <div className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(activity.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            {activity.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {activity.location}
              </span>
            )}
            {activity.ageRange && <span>Ages {activity.ageRange}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

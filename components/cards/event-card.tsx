"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommunityImage } from "@/components/ui/community-image";
import { eventCoverPhoto } from "@/lib/images/community-photos";
import type { MockEvent } from "@/lib/mock-data/events";
import { cn } from "@/lib/utils";

export function EventCard({
  event,
  onRsvp,
  compact,
}: {
  event: MockEvent;
  onRsvp?: (status: "going" | "interested") => void;
  compact?: boolean;
}) {
  const date = new Date(event.startsAt);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const cover = event.imageUrl ?? eventCoverPhoto(event.category);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md",
        compact ? "flex gap-0" : ""
      )}
    >
      {compact ? (
        <div className="relative h-auto w-24 shrink-0 self-stretch sm:w-28">
          <CommunityImage
            src={cover}
            alt={`${event.title} event photo`}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="relative h-40 w-full">
          <CommunityImage
            src={cover}
            alt={`${event.title} event photo`}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        </div>
      )}
      <div className={cn("p-4", compact && "flex-1")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="accent" className="capitalize">
              {event.category}
            </Badge>
            <h3 className="mt-2 font-semibold">{event.title}</h3>
          </div>
          {!compact && (
            <div className="shrink-0 rounded-xl bg-[var(--muted)] px-3 py-2 text-center">
              <div className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
                {date.toLocaleDateString("en-US", { month: "short" })}
              </div>
              <div className="text-xl font-bold">{date.getDate()}</div>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
          {event.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {dateStr} · {timeStr}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {event.rsvpCount} going
          </span>
          {event.ticketPrice !== undefined && (
            <span className="flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5" />
              {event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}
            </span>
          )}
        </div>
        {onRsvp && (
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant={event.rsvpStatus === "going" ? "default" : "outline"}
              onClick={() => onRsvp("going")}
            >
              Going
            </Button>
            <Button
              size="sm"
              variant={event.rsvpStatus === "interested" ? "default" : "outline"}
              onClick={() => onRsvp("interested")}
            >
              Interested
            </Button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

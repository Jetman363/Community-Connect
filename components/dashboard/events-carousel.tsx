"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard } from "@/components/cards/event-card";
import { mockEvents } from "@/lib/mock-data";
import { useRef } from "react";

export function EventsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const events = mockEvents.slice(0, 4);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Events</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="rounded-full p-1.5 hover:bg-[var(--muted)]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="rounded-full p-1.5 hover:bg-[var(--muted)]"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link href="/events" className="text-sm text-[var(--accent)] hover:underline ml-2">
            All events
          </Link>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
      >
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="w-72 shrink-0 snap-start"
          >
            <EventCard event={event} compact />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { EventCard } from "@/components/cards/event-card";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  mockEvents,
  eventCategories,
  type EventCategory,
  type MockEvent,
} from "@/lib/mock-data/events";
import { useToast } from "@/components/ui/toast";

export default function EventsPage() {
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [events, setEvents] = useState(mockEvents);
  const { toast } = useToast();

  const filtered =
    category === "all" ? events : events.filter((e) => e.category === category);

  const handleRsvp = (id: string, status: "going" | "interested") => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, rsvpStatus: status } : e))
    );
    toast(`RSVP updated: ${status}`, "success");
  };

  const upcoming = filtered.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  return (
    <PageTransition>
      <PageHeader
        title="Events"
        description="Community gatherings, markets, and local happenings"
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <FilterChipsAnimated
            options={eventCategories}
            value={category}
            onChange={setCategory}
            className="mb-6"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRsvp={(status) => handleRsvp(event.id, status)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView events={upcoming} />
        </TabsContent>

        <TabsContent value="map">
          <MapPlaceholder label="Events map" height="h-96" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcoming.slice(0, 4).map((e) => (
              <EventCard key={e.id} event={e} compact />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

function CalendarView({ events }: { events: MockEvent[] }) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {days.map((day) => {
        const dayEvents = events.filter(
          (e) => new Date(e.startsAt).toDateString() === day.toDateString()
        );
        return (
          <div
            key={day.toISOString()}
            className="min-h-20 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2"
          >
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              {day.toLocaleDateString("en-US", { weekday: "short" })}
            </p>
            <p className="text-lg font-semibold">{day.getDate()}</p>
            {dayEvents.map((e) => (
              <p key={e.id} className="mt-1 truncate text-[10px] text-[var(--accent)]">
                {e.title}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

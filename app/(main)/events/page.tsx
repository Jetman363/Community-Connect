"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilterChips } from "@/components/ui/filter-chips";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { EventCard } from "@/components/cards/event-card";
import { mockEvents, eventCategories, type EventCategory, type MockEvent } from "@/lib/mock-data";
import { Calendar } from "lucide-react";

export default function EventsPage() {
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [events, setEvents] = useState(mockEvents);

  const filtered =
    category === "all"
      ? events
      : events.filter((e) => e.category === category);

  const handleRsvp = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              rsvped: !e.rsvped,
              rsvpCount: e.rsvped ? e.rsvpCount - 1 : e.rsvpCount + 1,
            }
          : e
      )
    );
  };

  const groupedByDate = filtered.reduce<Record<string, MockEvent[]>>((acc, event) => {
    const date = new Date(event.startAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  return (
    <PageTransition>
      <PageHeader
        title="Events"
        description="Community gatherings, volunteer days, and local happenings"
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>

        <FilterChips
          options={eventCategories}
          value={category}
          onChange={setCategory}
          className="mb-6"
        />

        <TabsContent value="list">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="space-y-8">
            {Object.entries(groupedByDate).map(([date, dayEvents]) => (
              <section key={date}>
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-[var(--accent)]" />
                  {date}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onRsvp={handleRsvp} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map">
          <MapPlaceholder label="Event locations map" height="h-[50vh]" className="mb-6" />
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onRsvp={handleRsvp} compact />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

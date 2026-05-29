"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  _count?: { rsvps: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", startsAt: "" });

  function load() {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.items ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
      }),
    });
    setShowForm(false);
    setForm({ title: "", location: "", startsAt: "" });
    load();
  }

  async function rsvp(eventId: string) {
    await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Create event"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={createEvent} className="space-y-3">
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
              <Button type="submit">Save event</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((ev) => (
          <Card key={ev.id}>
            <CardHeader>
              <CardTitle className="text-base">{ev.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">{ev.location}</p>
              <p className="mt-1 text-sm">{format(new Date(ev.startsAt), "PPp")}</p>
              <p className="mt-2 text-xs">{ev._count?.rsvps ?? 0} RSVPs</p>
              <Button size="sm" className="mt-3" onClick={() => rsvp(ev.id)}>RSVP</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

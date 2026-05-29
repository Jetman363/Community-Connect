"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HOAPage() {
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string }[]>([]);
  const [documents, setDocuments] = useState<{ id: string; title: string }[]>([]);
  const [votes, setVotes] = useState<{ id: string; title: string; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/hoa").then((r) => r.json()).then((d) => {
      setAnnouncements(d.announcements ?? []);
      setDocuments(d.documents ?? []);
      setVotes(d.votes ?? []);
    });
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">HOA Management</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Announcements</h2>
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardHeader><CardTitle className="text-base">{a.title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{a.content}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Documents</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {documents.map((d) => (
            <Card key={d.id}><CardContent className="pt-5 text-sm font-medium">{d.title}</CardContent></Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Community votes</h2>
        {votes.map((v) => (
          <Card key={v.id} className="mb-2">
            <CardContent className="flex items-center justify-between pt-5">
              <span className="font-medium">{v.title}</span>
              <Badge>{v.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeroBanner } from "@/components/ui/page-hero-banner";
import { communityPhotos } from "@/lib/images/community-photos";
import { FileText, Vote, Megaphone, Download, Calendar, Wrench, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api/client";

type Announcement = { id: string; title: string; content: string; priority: string; createdAt: string };
type Document = { id: string; title: string; url: string; category: string };
type VoteItem = {
  id: string;
  title: string;
  description?: string;
  options: string[];
  status: string;
  endsAt?: string;
  ballotCount?: number;
  anonymous?: boolean;
};
type Meeting = { id: string; title: string; startsAt: string; location?: string; minutesUrl?: string };
type Rule = { id: string; title: string; content: string; category: string };

export default function HoaPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [maintenance, setMaintenance] = useState({ title: "", description: "", location: "" });

  useEffect(() => {
    void (async () => {
      try {
        const [a, d, v, m, r] = await Promise.all([
          apiFetch<{ items: Announcement[] }>("/api/hoa/announcements"),
          apiFetch<{ items: Document[] }>("/api/hoa/documents"),
          apiFetch<{ items: VoteItem[] }>("/api/hoa/votes"),
          apiFetch<{ items: Meeting[] }>("/api/hoa/meetings"),
          apiFetch<{ items: Rule[] }>("/api/hoa/rules"),
        ]);
        setAnnouncements(a.items);
        setDocuments(d.items);
        setVotes(v.items.filter((x) => x.status === "OPEN"));
        setMeetings(m.items);
        setRules(r.items);
      } catch {
        /* keep empty — demo offline */
      }
    })();
  }, []);

  const castVote = async (voteId: string, optionIndex: number) => {
    try {
      await apiFetch(`/api/hoa/votes/${voteId}/cast`, {
        method: "POST",
        body: JSON.stringify({ optionIndex }),
      });
      alert("Vote recorded");
    } catch {
      alert("Could not record vote (login or DB required)");
    }
  };

  const submitMaintenance = async () => {
    try {
      await apiFetch("/api/hoa/maintenance-requests", {
        method: "POST",
        body: JSON.stringify(maintenance),
      });
      setMaintenance({ title: "", description: "", location: "" });
      alert("Request submitted");
    } catch {
      alert("Could not submit request");
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="HOA Portal"
        description="Announcements, documents, voting, meetings, rules, and maintenance"
      />

      <PageHeroBanner
        src={communityPhotos.hero.hoa}
        alt="Community center building"
        title="Oak Hills HOA"
        description="Governance, documents, and resident services in one place"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Megaphone className="h-5 w-5" />
            Announcements
          </h2>
          <div className="space-y-3">
            {announcements.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">No announcements yet</p>
            )}
            {announcements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{a.content}</p>
                    </div>
                    <Badge>{a.priority}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Vote className="h-5 w-5" />
            Active Votes
          </h2>
          <div className="space-y-3">
            {votes.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{v.title}</p>
                  {v.anonymous && (
                    <Badge variant="accent" className="mt-1">
                      Anonymous
                    </Badge>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {v.options.map((opt, idx) => (
                      <Button key={idx} size="sm" variant="outline" onClick={() => castVote(v.id, idx)}>
                        {opt}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            Meetings
          </h2>
          <div className="space-y-2">
            {meetings.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4 text-sm">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(m.startsAt).toLocaleString()}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                  {m.minutesUrl && (
                    <a href={m.minutesUrl} className="text-xs text-[var(--accent)] mt-1 inline-block">
                      Minutes
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Wrench className="h-5 w-5" />
            Maintenance request
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder="Title"
                value={maintenance.title}
                onChange={(e) => setMaintenance((s) => ({ ...s, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description"
                value={maintenance.description}
                onChange={(e) => setMaintenance((s) => ({ ...s, description: e.target.value }))}
              />
              <Input
                placeholder="Location"
                value={maintenance.location}
                onChange={(e) => setMaintenance((s) => ({ ...s, location: e.target.value }))}
              />
              <Button onClick={submitMaintenance} disabled={!maintenance.title || !maintenance.description}>
                Submit
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Documents
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{doc.category}</p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 text-[var(--accent)]" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5" />
            Community rules
          </h2>
          <div className="space-y-2">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{rule.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{rule.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

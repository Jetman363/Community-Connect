"use client";

import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Vote, Megaphone, Download } from "lucide-react";
import { motion } from "framer-motion";

const documents = [
  { title: "Community Bylaws 2025", type: "PDF", updated: "Jan 2025" },
  { title: "Architectural Guidelines", type: "PDF", updated: "Mar 2024" },
  { title: "Pool Rules & Hours", type: "PDF", updated: "May 2025" },
];

const announcements = [
  { title: "Pool maintenance May 30–31", date: "May 28", priority: "info" },
  { title: "Annual dues reminder", date: "May 15", priority: "advisory" },
  { title: "Board meeting — June 5", date: "May 10", priority: "info" },
];

const votes = [
  { title: "New playground equipment", deadline: "Jun 15", votes: 142, total: 200 },
  { title: "EV charging stations", deadline: "Jun 20", votes: 89, total: 200 },
];

export default function HoaPage() {
  return (
    <PageTransition>
      <PageHeader
        title="HOA Portal"
        description="Documents, announcements, and community votes"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Megaphone className="h-5 w-5" />
            Announcements
          </h2>
          <div className="space-y-3">
            {announcements.map((a, i) => (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{a.date}</p>
                    </div>
                    <Badge variant={a.priority === "advisory" ? "accent" : "default"}>
                      {a.priority}
                    </Badge>
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
              <Card key={v.title}>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{v.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Deadline: {v.deadline}
                  </p>
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${(v.votes / v.total) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {v.votes}/{v.total} votes
                    </p>
                  </div>
                  <Button size="sm" className="mt-3">
                    Cast Vote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Documents
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {documents.map((doc) => (
              <Card key={doc.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {doc.type} · {doc.updated}
                  </span>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

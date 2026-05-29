"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Bell, Calendar, Bot, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { demoAlerts, demoEvents, demoBusinesses, demoPosts } from "@/lib/demo-data";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold">
            Community <span className="text-[var(--accent)]">Connect</span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight md:text-6xl"
        >
          Your community, connected
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-[var(--muted-foreground)]"
        >
          Safety alerts, local services, events, and neighbors — all in one premium experience.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm"
        >
          <Search className="ml-2 h-5 w-5 text-[var(--muted-foreground)]" />
          <Input
            placeholder="What do you need today?"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button size="sm">Search</Button>
        </motion.div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/alerts"><Button variant="outline" size="sm"><Bell className="h-4 w-4" /> Alerts</Button></Link>
          <Link href="/assistant"><Button variant="outline" size="sm"><Bot className="h-4 w-4" /> AI Help</Button></Link>
          <Link href="/register"><Button size="sm">Join free <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active alerts</h2>
          <Link href="/alerts" className="text-sm text-[var(--accent)]">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {demoAlerts.map((a) => (
            <Card key={a.id} className={a.severity === "WARNING" ? "border-[var(--emergency)]/30" : ""}>
              <CardHeader className="flex-row items-start justify-between">
                <CardTitle className="text-base">{a.title}</CardTitle>
                <Badge variant={a.severity === "EMERGENCY" || a.severity === "WARNING" ? "emergency" : "accent"}>
                  {a.severity}
                </Badge>
              </CardHeader>
              <CardContent><p className="text-sm text-[var(--muted-foreground)]">{a.description}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-4 text-xl font-semibold">Upcoming events</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {demoEvents.map((e) => (
            <Card key={e.id} className="min-w-[260px] shrink-0">
              <CardContent className="pt-5">
                <Calendar className="mb-2 h-5 w-5 text-[var(--accent)]" />
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{e.location}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{e.rsvpCount} going</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-4 text-xl font-semibold">Nearby services</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {demoBusinesses.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{b.category}</p>
                </div>
                <span className="text-sm font-medium">★ {b.rating}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-4 text-xl font-semibold">Trending in community</h2>
        <div className="space-y-3">
          {demoPosts.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-5">
                <p className="text-sm">{p.content}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {p.author.displayName} · {p.likes} likes · {p.comments} comments
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center md:flex-row md:text-left">
            <MapPin className="h-10 w-10 text-[var(--accent)]" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Community map</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Explore alerts, services, and reports on an interactive map.
              </p>
            </div>
            <Link href="/map"><Button>Open map</Button></Link>
          </CardContent>
        </Card>
      </section>

      <div className="fixed bottom-4 left-4 right-4 md:hidden">
        <Link href="/register" className="block">
          <Button className="w-full shadow-lg" size="lg">Join your community</Button>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { siteConfig } from "@/config/site";

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
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{siteConfig.description}</h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted-foreground)]">
          Safety alerts, local services, events, and neighbors — one connected platform for your
          community.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button size="lg">
              Join your community <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

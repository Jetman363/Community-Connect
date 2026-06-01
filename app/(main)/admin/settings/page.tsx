"use client";

import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminSettingsLinks } from "@/config/admin-settings";
import { ChevronRight } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Admin Settings"
        description="Platform administration — separate from your personal account settings"
        action={
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Admin Console
            </Button>
          </Link>
        }
      />

      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Manage roles, monitor site health, and configure system operations. Residents use{" "}
        <Link href="/settings" className="text-[var(--accent)] hover:underline">
          /settings
        </Link>{" "}
        for personal preferences.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {adminSettingsLinks.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block">
            <Card className="h-full transition-colors group-hover:border-[var(--accent)]/40">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="rounded-lg bg-[var(--muted)] p-2">
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{label}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--accent)]" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
          <span className="text-[var(--muted-foreground)]">
            Export audit trail or review enterprise analytics from the main console.
          </span>
          <div className="flex gap-2">
            <Link href="/api/admin/audit-logs/export">
              <Button variant="outline" size="sm">
                Export audit CSV
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm">Open console</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

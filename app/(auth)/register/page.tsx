"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";

const OAUTH_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
] as const;

export default function RegisterPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    username: "",
    avatarUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOAuth(provider: string) {
    try {
      const res = await fetch(`/api/auth/oauth/${provider}`, { method: "POST" });
      const data = (await res.json()) as { message?: string };
      toast(data.message ?? `${provider} sign-in coming soon`, "info");
    } catch {
      toast("OAuth unavailable", "error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const displayName =
      form.firstName && form.lastName
        ? `${form.firstName} ${form.lastName}`
        : form.firstName || form.lastName || undefined;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          displayName,
          username: form.username || undefined,
          avatarUrl: form.avatarUrl || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      window.location.assign("/onboarding/location");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      headline="Join your neighborhood on Radius"
      subline="Create a free account to get local deals, events, and community connections."
    >
      <Card className="w-full max-w-md border-[var(--border)] shadow-lg">
        <CardHeader>
          <CardTitle>Create your Radius account</CardTitle>
          <CardDescription>Join Community Connect — powered by Radius personalization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-2">
            {OAUTH_PROVIDERS.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void handleOAuth(p.id)}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--card)] px-2 text-xs text-[var(--muted-foreground)]">
              or email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="alex_neighbor"
              />
            </div>
            <div>
              <Label htmlFor="avatarUrl">Profile photo URL (optional)</Label>
              <Input
                id="avatarUrl"
                value={form.avatarUrl}
                onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                placeholder="https://…"
              />
            </div>
            {error && <p className="text-sm text-[var(--emergency)]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
            Have an account? <Link href="/login" className="text-[var(--accent)]">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </AuthSplitLayout>
  );
}

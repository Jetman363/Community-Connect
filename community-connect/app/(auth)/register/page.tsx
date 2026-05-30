"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      headline="Join neighbors who stay informed"
      subline="Create a free account to get alerts, RSVP to events, and connect locally."
    >
      <Card className="w-full max-w-md border-[var(--border)] shadow-lg">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Join your local community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(["displayName", "email", "password"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium capitalize">
                  {field === "displayName" ? "Display name" : field}
                </label>
                <Input
                  type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                  minLength={field === "password" ? 8 : undefined}
                />
              </div>
            ))}
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

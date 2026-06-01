"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const isAdminLogin = searchParams.get("admin") === "1";
  const [email, setEmail] = useState("demo@communityconnect.app");
  const [password, setPassword] = useState("Demo1234!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("auth") === "failed") {
      setError("Sign-in succeeded but the session was not accepted. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      window.location.assign(redirect);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <Card className="w-full max-w-md border-[var(--border)] shadow-lg">
        <CardHeader>
          <CardTitle>{isAdminLogin ? "Administrator sign in" : "Welcome back"}</CardTitle>
          <CardDescription>
            {isAdminLogin
              ? "Sign in with an ADMIN or SUPER_ADMIN account to access /admin"
              : "Sign in to Community Connect"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-[var(--emergency)]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Google", "Apple", "Facebook"].map((p) => (
              <Button key={p} variant="outline" size="sm" type="button" disabled title="OAuth stub">
                {p}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
            No account? <Link href="/register" className="text-[var(--accent)]">Register</Link>
            {isAdminLogin ? (
              <>
                {" · "}
                <Link href="/login" className="text-[var(--accent)]">
                  Resident login
                </Link>
              </>
            ) : null}
          </p>
        </CardContent>
      </Card>
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

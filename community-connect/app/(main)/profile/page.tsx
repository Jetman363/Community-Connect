"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Me {
  email: string;
  role: string;
  verified: boolean;
  profile?: { displayName: string; bio?: string; badges: string[] };
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!me) return <p className="text-[var(--muted-foreground)]">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{me.profile?.displayName ?? me.email}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">{me.email}</p>
          <Badge variant="accent">{me.role}</Badge>
          {me.verified && <Badge variant="success">Verified</Badge>}
          {me.profile?.bio && <p className="text-sm">{me.profile.bio}</p>}
          <Button variant="outline" onClick={logout} className="w-full">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

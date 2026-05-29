"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<{ id: string; email: string; role: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}>
            <CardContent className="pt-5 text-center">
              <p className="text-2xl font-bold">{v}</p>
              <p className="text-sm capitalize text-[var(--muted-foreground)]">{k}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
          Incident heat map placeholder — connect analytics service in production
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>User management</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-[var(--muted)] px-3 py-2 text-sm">
                <span>{u.email}</span>
                <Badge>{u.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

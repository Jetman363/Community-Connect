"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Listing {
  id: string;
  title: string;
  description?: string;
  price?: number;
  type: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/marketplace")
      .then((r) => r.json())
      .then((d) => setListings(d.items ?? []));
  }, []);

  const filtered = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marketplace & Jobs</h1>
      <Input placeholder="Search listings…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((l) => (
          <Card key={l.id}>
            <CardContent className="pt-5">
              <div className="mb-2 flex items-start justify-between">
                <p className="font-medium">{l.title}</p>
                <Badge>{l.type.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{l.description}</p>
              {l.price != null && <p className="mt-2 font-semibold">${l.price}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

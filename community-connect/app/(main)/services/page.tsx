"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  verified: boolean;
  description?: string;
}

export default function ServicesPage() {
  const [items, setItems] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch("/api/businesses").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  }, []);

  const categories = ["all", ...new Set(items.map((b) => b.category))];
  const filtered = items.filter((b) => {
    const matchCat = category === "all" || b.category === category;
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Local Services</h1>
      <Input placeholder="Search businesses & services…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              category === c ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex items-start justify-between pt-5">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{b.category}</p>
                {b.verified && <Badge variant="success" className="mt-2">Verified</Badge>}
              </div>
              <span className="font-semibold">★ {b.rating}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

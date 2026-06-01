"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { FilterChips } from "@/components/ui/filter-chips";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessCard } from "@/components/cards/business-card";
import { mockBusinesses, serviceCategories, type ServiceCategory, type MockBusiness } from "@/lib/mock-data";
import { Search, Phone, MapPin, Clock, Star } from "lucide-react";

export default function ServicesPage() {
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockBusiness | null>(null);

  const filtered = mockBusinesses.filter((b) => {
    const matchesCategory = category === "all" || b.category === category;
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      <PageHeader
        title="Local Services"
        description="Verified businesses, reviews, and neighborhood services"
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <FilterChips options={serviceCategories} value={category} onChange={setCategory} className="mb-6" />

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((business) => (
          <BusinessCard key={business.id} business={business} onClick={() => setSelected(business)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No businesses found</p>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selected.verified && <Badge variant="accent">Verified</Badge>}
              <Badge>{selected.category}</Badge>
              <span className="flex items-center gap-1 text-sm text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                {selected.rating} ({selected.reviewCount} reviews)
              </span>
            </div>
            <p className="text-sm leading-relaxed">{selected.description}</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <MapPin className="h-4 w-4" />
                {selected.address} · {selected.distance}
              </p>
              <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Phone className="h-4 w-4" />
                {selected.phone}
              </p>
              <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Clock className="h-4 w-4" />
                {selected.hours}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <Button className="w-full">
              <Phone className="h-4 w-4" />
              Call {selected.name}
            </Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

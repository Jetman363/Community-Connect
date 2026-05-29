"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { BusinessCard } from "@/components/cards/business-card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  mockBusinesses,
  serviceCategories,
  type ServiceCategory,
  type MockBusiness,
} from "@/lib/mock-data/businesses";
import { Search, Star, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ServicesPage() {
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockBusiness | null>(null);

  const filtered = mockBusinesses.filter((b) => {
    const matchCat = category === "all" || b.category === category;
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <PageTransition>
      <PageHeader
        title="Services Directory"
        description="Verified local businesses and neighborhood services"
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <FilterChipsAnimated
        options={serviceCategories}
        value={category}
        onChange={setCategory}
        className="mb-6"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onSelect={() => setSelected(business)}
          />
        ))}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected?.categoryLabel}
      >
        {selected && (
          <div className="space-y-4">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt="" className="w-full rounded-xl object-cover h-48" />
            )}
            <p className="text-sm">{selected.description}</p>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{selected.rating}</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                ({selected.reviewCount} reviews)
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {selected.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {selected.phone}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> {selected.hours}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Call
              </Button>
              <Button className="flex-1">Get Directions</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

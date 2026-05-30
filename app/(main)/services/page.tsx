"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { FilterChips } from "@/components/ui/filter-chips";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessCard } from "@/components/cards/business-card";
import { InquiryForm } from "@/components/marketplace/inquiry-form";
import { ReviewSection } from "@/components/marketplace/review-section";
import { useBusinesses, businessCategories } from "@/hooks/use-businesses";
import type { BusinessDto, ReviewDto } from "@/types/marketplace";
import { fetchBusinessReviews } from "@/lib/api/client";
import { Search, Phone, MapPin, Star, ExternalLink } from "lucide-react";

export default function ServicesPage() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selected, setSelected] = useState<BusinessDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { businesses, loading, source, toggleFavorite } = useBusinesses({
    category,
    search: search || undefined,
    verified: verifiedOnly || undefined,
  });

  async function openBusiness(business: BusinessDto) {
    setSelected(business);
    setReviewsLoading(true);
    try {
      const res = await fetchBusinessReviews(business.id);
      setReviews(res.items);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Local Services"
        description="Verified businesses, reviews, and neighborhood services"
        action={
          <Link href="/search">
            <Button size="sm" variant="outline">
              Discover all
            </Button>
          </Link>
        }
      />

      {source === "mock" && (
        <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          Demo data — database offline.
        </p>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChips
          options={businessCategories.map((c) => ({ id: c.id, label: c.label }))}
          value={category}
          onChange={setCategory}
        />
        <button
          type="button"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            verifiedOnly
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--muted)] text-[var(--muted-foreground)]"
          }`}
        >
          Verified only
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onSelect={() => openBusiness(business)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {businesses.length === 0 && !loading && (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No businesses found</p>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        className="sm:max-w-2xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {selected.verified && <Badge variant="accent">Verified</Badge>}
              <Badge>{selected.category}</Badge>
              <span className="flex items-center gap-1 text-sm text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                {selected.rating.toFixed(1)} ({selected.reviewCount} reviews)
              </span>
            </div>
            <p className="text-sm leading-relaxed">{selected.description}</p>
            <div className="space-y-2 text-sm">
              {selected.address && (
                <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <MapPin className="h-4 w-4" />
                  {selected.address}
                </p>
              )}
              {selected.phone && (
                <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <Phone className="h-4 w-4" />
                  {selected.phone}
                </p>
              )}
              {selected.website && (
                <a
                  href={selected.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--accent)] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InquiryForm businessId={selected.id} />
              <InquiryForm businessId={selected.id} quoteRequest />
            </div>
            <Link href={`/businesses/${selected.id}`} className="text-sm text-[var(--accent)]">
              Full profile & analytics →
            </Link>
            {reviewsLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <ReviewSection businessId={selected.id} reviews={reviews} />
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

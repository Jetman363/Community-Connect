"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryForm } from "@/components/marketplace/inquiry-form";
import { MarketplaceSearchHero } from "@/components/marketplace/marketplace-search-hero";
import { CategoryChips } from "@/components/marketplace/category-chips";
import { FeaturedRow } from "@/components/marketplace/featured-row";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { ListingList } from "@/components/marketplace/listing-list";
import { ClassifiedsSection } from "@/components/marketplace/classifieds-section";
import { JobsSection } from "@/components/marketplace/jobs-section";
import { DealsSection } from "@/components/marketplace/deals-section";
import { BusinessesRow } from "@/components/marketplace/businesses-row";
import { ServicesRow } from "@/components/marketplace/services-row";
import { ListingDetailModal } from "@/components/marketplace/listing-detail-modal";
import { BusinessCard } from "@/components/cards/business-card";
import { ReviewSection } from "@/components/marketplace/review-section";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useJobs } from "@/hooks/use-jobs";
import { useBusinesses } from "@/hooks/use-businesses";
import type { MarketplaceListingDto, JobListingDto, BusinessDto, ReviewDto } from "@/types/marketplace";
import { createListing, fetchBusinessReviews } from "@/lib/api/client";
import { mockDeals } from "@/lib/mock-data/deals";
import {
  getMockRecentListings,
  getMockNearbyListings,
  getMockTrendingListings,
  getMockGiveawayListings,
  getMockWantedListings,
  getMockClassifiedListings,
  getMockBusinessesDto,
} from "@/lib/api/fallback-marketplace";
import { Plus } from "lucide-react";

type HubTab = "buy-sell" | "classifieds" | "services" | "jobs" | "businesses";

const HUB_TABS = new Set<HubTab>(["buy-sell", "classifieds", "services", "jobs", "businesses"]);

function hubTabFromQuery(tab: string | null): HubTab {
  if (tab && HUB_TABS.has(tab as HubTab)) return tab as HubTab;
  return "buy-sell";
}

function CreateListingModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await createListing({
        title,
        description,
        price: price ? Number(price) : undefined,
        category: "BUY_SELL",
        type: "FOR_SALE",
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrice("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1">
        <Plus className="h-4 w-4" />
        List item
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create listing">
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Price (optional)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Button className="w-full" onClick={submit} disabled={saving || title.length < 3}>
            {saving ? "Posting..." : "Post listing"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [hubTab, setHubTab] = useState<HubTab>(() => hubTabFromQuery(searchParams.get("tab")));

  useEffect(() => {
    setHubTab(hubTabFromQuery(searchParams.get("tab")));
  }, [searchParams]);
  const [category, setCategory] = useState("all");
  const [classifiedFilter, setClassifiedFilter] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Oak Hills");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MarketplaceListingDto | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListingDto | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const apiCategory = category === "all" ? undefined : "BUY_SELL";

  const {
    listings,
    featured,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    source,
    toggleFavorite,
    refresh,
  } = useMarketplace({ category: apiCategory, search: search || undefined });

  const { jobs, loading: jobsLoading, source: jobsSource, refresh: refreshJobs } = useJobs({
    jobType,
    search: search || undefined,
  });

  const {
    businesses,
    loading: bizLoading,
    source: bizSource,
    toggleFavorite: toggleBizFavorite,
  } = useBusinesses({ search: search || undefined });

  const sentinelRef = useRef<HTMLDivElement>(null);

  const recentListings = useMemo(() => getMockRecentListings().slice(0, 6), []);
  const nearbyListings = useMemo(() => getMockNearbyListings(), []);
  const trendingListings = useMemo(() => getMockTrendingListings(), []);
  const giveawayListings = useMemo(() => getMockGiveawayListings(), []);
  const wantedListings = useMemo(() => getMockWantedListings(), []);
  const classifiedListings = useMemo(() => getMockClassifiedListings(), []);

  const displayBusinesses = businesses.length > 0 ? businesses : getMockBusinessesDto();
  const displayFeatured = featured.length > 0 ? featured : getMockTrendingListings().filter((l) => l.featured);
  const displayListings =
    listings.length > 0
      ? listings
      : source === "mock"
        ? getMockMarketplaceFiltered(category, search)
        : listings;

  useEffect(() => {
    if (hubTab !== "buy-sell") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hubTab]);

  async function openBusiness(business: BusinessDto) {
    setSelectedBusiness(business);
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

  const showHubSections = hubTab === "buy-sell" && !search && category === "all";

  return (
    <PageTransition>
      <PageHeader
        title="Marketplace"
        description="Buy, sell, classifieds, services, jobs, and local businesses"
        action={<CreateListingModal onCreated={refresh} />}
      />

      {(source === "mock" || jobsSource === "mock" || bizSource === "mock") && (
        <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          Demo data — database offline. Run migrations and seed for live data.
        </p>
      )}

      <MarketplaceSearchHero
        search={search}
        onSearchChange={setSearch}
        location={location}
        onLocationChange={setLocation}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sticky
      />

      <Tabs
        value={hubTab}
        onValueChange={(v) => setHubTab(v as HubTab)}
        className="mb-6"
      >
        <TabsList className="flex w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="buy-sell">Buy/Sell</TabsTrigger>
          <TabsTrigger value="classifieds">Classifieds</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
        </TabsList>
      </Tabs>

      {hubTab === "buy-sell" && (
        <>
          <CategoryChips value={category} onChange={setCategory} className="mb-6" />

          {showHubSections && (
            <>
              <FeaturedRow
                listings={displayFeatured}
                onSelect={setSelected}
                onToggleFavorite={toggleFavorite}
                title="Featured Listings"
              />

              <FeaturedRow
                listings={recentListings}
                onSelect={setSelected}
                onToggleFavorite={toggleFavorite}
                title="Recently Posted"
              />

              <FeaturedRow
                listings={nearbyListings}
                onSelect={setSelected}
                onToggleFavorite={toggleFavorite}
                title="Nearby Listings"
              />

              <FeaturedRow
                listings={trendingListings}
                onSelect={setSelected}
                onToggleFavorite={toggleFavorite}
                title="Trending Listings"
              />

              <DealsSection deals={mockDeals} />

              <BusinessesRow
                businesses={displayBusinesses}
                onSelect={openBusiness}
                onToggleFavorite={toggleBizFavorite}
              />

              <ServicesRow
                businesses={displayBusinesses}
                onSelect={openBusiness}
                onToggleFavorite={toggleBizFavorite}
              />

              <JobsSection
                jobs={jobs}
                loading={jobsLoading}
                jobType={jobType}
                onJobTypeChange={setJobType}
                onSelect={setSelectedJob}
                compact
              />

              {giveawayListings.length > 0 && (
                <FeaturedRow
                  listings={giveawayListings}
                  onSelect={setSelected}
                  onToggleFavorite={toggleFavorite}
                  title="Community Giveaways"
                />
              )}

              {wantedListings.length > 0 && (
                <FeaturedRow
                  listings={wantedListings}
                  onSelect={setSelected}
                  onToggleFavorite={toggleFavorite}
                  title="Wanted Requests"
                />
              )}
            </>
          )}

          {viewMode === "grid" ? (
            <ListingGrid
              listings={displayListings}
              loading={loading}
              onSelect={setSelected}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <ListingList
              listings={displayListings}
              loading={loading}
              onSelect={setSelected}
              onToggleFavorite={toggleFavorite}
            />
          )}

          <div ref={sentinelRef} className="h-4" />
          {loadingMore && <Skeleton className="mt-4 h-32" />}
        </>
      )}

      {hubTab === "classifieds" && (
        <ClassifiedsSection
          listings={classifiedListings.length > 0 ? classifiedListings : displayListings}
          filter={classifiedFilter}
          onFilterChange={setClassifiedFilter}
          onSelect={setSelected}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {hubTab === "services" && (
        <>
          <ServicesRow
            businesses={displayBusinesses}
            onSelect={openBusiness}
            onToggleFavorite={toggleBizFavorite}
          />
          {bizLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayBusinesses.map((b) => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  onSelect={() => openBusiness(b)}
                  onToggleFavorite={toggleBizFavorite}
                />
              ))}
            </div>
          )}
          <div className="mt-6 rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-semibold">Request a Quote</h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Compare providers and request quotes from verified local businesses.
            </p>
            <Link href="/services" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
              Open full services directory →
            </Link>
          </div>
        </>
      )}

      {hubTab === "jobs" && (
        <JobsSection
          jobs={jobs}
          loading={jobsLoading}
          jobType={jobType}
          onJobTypeChange={setJobType}
          onSelect={setSelectedJob}
        />
      )}

      {hubTab === "businesses" && (
        <>
          <BusinessesRow
            businesses={displayBusinesses}
            onSelect={openBusiness}
            onToggleFavorite={toggleBizFavorite}
          />
          {bizLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayBusinesses.map((b) => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  onSelect={() => openBusiness(b)}
                  onToggleFavorite={toggleBizFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ListingDetailModal listing={selected} onClose={() => setSelected(null)} />

      <Modal open={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title}>
        {selectedJob && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{selectedJob.description}</p>
            <InquiryForm jobId={selectedJob.id} onSent={() => setSelectedJob(null)} />
          </div>
        )}
      </Modal>

      <Modal
        open={!!selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        title={selectedBusiness?.name}
      >
        {selectedBusiness && (
          <div className="space-y-4">
            <BusinessCard business={selectedBusiness} />
            <InquiryForm businessId={selectedBusiness.id} quoteRequest />
            {reviewsLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <ReviewSection reviews={reviews} businessId={selectedBusiness.id} />
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

function getMockMarketplaceFiltered(category: string, search: string) {
  let items = getMockRecentListings();
  if (category !== "all") {
    items = items.filter((l) => l.subCategory === category);
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description?.toLowerCase().includes(q) ?? false)
    );
  }
  return items;
}

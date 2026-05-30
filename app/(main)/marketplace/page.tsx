"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { FilterChips } from "@/components/ui/filter-chips";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import { InquiryForm } from "@/components/marketplace/inquiry-form";
import { useMarketplace, marketplaceCategories } from "@/hooks/use-marketplace";
import { useJobs, jobTypes } from "@/hooks/use-jobs";
import type { MarketplaceListingDto, JobListingDto } from "@/types/marketplace";
import { createListing } from "@/lib/api/client";
import { Search, MapPin, Plus, Briefcase } from "lucide-react";
import { formatRelative } from "@/lib/utils";

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

function JobCard({ job, onSelect }: { job: JobListingDto; onSelect: () => void }) {
  return (
    <article
      onClick={onSelect}
      className="cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="accent">{job.jobType.replace("_", " ")}</Badge>
        {job.remote && <Badge>Remote</Badge>}
      </div>
      <h3 className="mt-2 font-semibold">{job.title}</h3>
      {job.description && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{job.description}</p>
      )}
      <p className="mt-2 text-sm font-medium">
        {job.salaryMin != null
          ? `$${job.salaryMin}${job.salaryMax ? `–$${job.salaryMax}` : ""}${job.salaryUnit ? `/${job.salaryUnit}` : ""}`
          : "Compensation TBD"}
      </p>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        {job.location ?? "Local"} · {job.poster.displayName}
      </p>
    </article>
  );
}

export default function MarketplacePage() {
  const [tab, setTab] = useState<"listings" | "jobs">("listings");
  const [category, setCategory] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MarketplaceListingDto | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListingDto | null>(null);

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
  } = useMarketplace({ category, search: search || undefined });

  const { jobs, loading: jobsLoading, source: jobsSource, refresh: refreshJobs } = useJobs({
    jobType,
    search: search || undefined,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab !== "listings") return;
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
  }, [loadMore, tab]);

  return (
    <PageTransition>
      <PageHeader
        title="Marketplace"
        description="Buy, sell, trade, services, and local jobs"
        action={<CreateListingModal onCreated={refresh} />}
      />

      {(source === "mock" || jobsSource === "mock") && (
        <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          Demo data — database offline. Run migrations and seed for live data.
        </p>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search listings and jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "listings" | "jobs")} className="mb-4">
        <TabsList>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="jobs">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              Jobs
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "listings" && (
        <>
          {featured.length > 0 && !search && category === "all" && (
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Featured
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-3 md:overflow-visible">
                {featured.map((listing) => (
                  <div key={listing.id} className="min-w-[260px] snap-start md:min-w-0">
                    <MarketplaceListingCard
                      listing={listing}
                      onSelect={() => setSelected(listing)}
                      onToggleFavorite={toggleFavorite}
                      compact
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <FilterChips
            options={marketplaceCategories.map((c) => ({ id: c.id, label: c.label }))}
            value={category}
            onChange={setCategory}
            className="mb-6"
          />

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  onSelect={() => setSelected(listing)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          {listings.length === 0 && !loading && (
            <p className="py-12 text-center text-[var(--muted-foreground)]">No listings found</p>
          )}

          <div ref={sentinelRef} className="h-4" />
          {loadingMore && <Skeleton className="mt-4 h-32" />}
        </>
      )}

      {tab === "jobs" && (
        <>
          <FilterChips
            options={jobTypes.map((j) => ({ id: j.id, label: j.label }))}
            value={jobType}
            onChange={setJobType}
            className="mb-6"
          />
          {jobsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onSelect={() => setSelectedJob(job)} />
              ))}
            </div>
          )}
          {jobs.length === 0 && !jobsLoading && (
            <p className="py-12 text-center text-[var(--muted-foreground)]">No jobs posted yet</p>
          )}
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="accent">{selected.category}</Badge>
              {selected.price != null && (
                <span className="text-xl font-semibold">${selected.price}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed">{selected.description}</p>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <MapPin className="h-4 w-4" />
              {selected.locationLabel ?? "Local"}
            </div>
            <p className="text-sm">
              Listed by <strong>{selected.seller.displayName}</strong> ·{" "}
              {formatRelative(selected.createdAt)}
            </p>
            <InquiryForm listingId={selected.id} />
            <Link href="/map" className="text-sm text-[var(--accent)] hover:underline">
              View on map
            </Link>
          </div>
        )}
      </Modal>

      <Modal open={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.title}>
        {selectedJob && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{selectedJob.description}</p>
            <InquiryForm jobId={selectedJob.id} onSent={() => setSelectedJob(null)} />
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import { BusinessCard } from "@/components/cards/business-card";
import { discoverSearch } from "@/lib/api/client";
import type { MarketplaceListingDto, BusinessDto, JobListingDto } from "@/types/marketplace";
import { Search, Briefcase } from "lucide-react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>("db");
  const [listings, setListings] = useState<MarketplaceListingDto[]>([]);
  const [businesses, setBusinesses] = useState<BusinessDto[]>([]);
  const [jobs, setJobs] = useState<JobListingDto[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const res = await discoverSearch({ q: debounced || undefined });
        setListings(res.listings);
        setBusinesses(res.businesses);
        setJobs(res.jobs);
        setSource(res.source ?? "db");
      } catch {
        setListings([]);
        setBusinesses([]);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [debounced]);

  return (
    <PageTransition>
      <PageHeader title="Discover" description="Search listings, businesses, and jobs in one place" />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search everything..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {source === "mock" && (
        <p className="mb-4 text-xs text-amber-600">Demo data mode</p>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Listings ({listings.length})</h2>
            {listings.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No listings match</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((l) => (
                  <Link key={l.id} href="/marketplace">
                    <MarketplaceListingCard listing={l} compact />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Businesses ({businesses.length})</h2>
            {businesses.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No businesses match</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((b) => (
                  <Link key={b.id} href={`/businesses/${b.id}`}>
                    <BusinessCard business={b} compact />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="h-5 w-5" />
              Jobs ({jobs.length})
            </h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No jobs match</p>
            ) : (
              <ul className="space-y-3">
                {jobs.map((j) => (
                  <li key={j.id}>
                    <Link
                      href="/marketplace"
                      className="block rounded-xl border border-[var(--border)] p-4 hover:bg-[var(--muted)]/30"
                    >
                      <p className="font-medium">{j.title}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {j.jobType.replace("_", " ")} · {j.location ?? "Local"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageTransition>
  );
}

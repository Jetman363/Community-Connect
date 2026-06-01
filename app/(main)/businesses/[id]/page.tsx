"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewSection } from "@/components/marketplace/review-section";
import { InquiryForm } from "@/components/marketplace/inquiry-form";
import {
  fetchBusiness,
  fetchBusinessReviews,
  fetchBusinessAnalytics,
} from "@/lib/api/client";
import type { BusinessDto, ReviewDto, ServiceDto, BusinessAnalyticsDto } from "@/types/marketplace";
import { Star, MapPin, Phone, BarChart3, ArrowLeft } from "lucide-react";

export default function BusinessProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [business, setBusiness] = useState<
    (BusinessDto & { services?: ServiceDto[] }) | null
  >(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [b, r, a] = await Promise.all([
          fetchBusiness(id),
          fetchBusinessReviews(id),
          fetchBusinessAnalytics(id).catch(() => null),
        ]);
        setBusiness(b);
        setReviews(r.items);
        setAnalytics(a);
      } catch {
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="mt-4 h-32" />
      </PageTransition>
    );
  }

  if (!business) {
    return (
      <PageTransition>
        <p className="py-12 text-center">Business not found</p>
        <Link href="/services" className="text-[var(--accent)]">
          ← Back to services
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Link
        href="/services"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Services
      </Link>

      {business.coverPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.coverPhotoUrl}
          alt=""
          className="mb-4 h-40 w-full rounded-2xl object-cover"
        />
      )}

      <PageHeader title={business.name} description={business.category} />

      <div className="mb-6 flex flex-wrap gap-2">
        {business.verified && <Badge variant="accent">Verified</Badge>}
        {business.verificationBadges.map((b) => (
          <Badge key={b}>{b}</Badge>
        ))}
        <span className="flex items-center gap-1 text-sm text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          {business.rating.toFixed(1)} ({business.reviewCount})
        </span>
      </div>

      <p className="mb-6 text-sm leading-relaxed">{business.description}</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {business.address && (
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
            {business.address}
          </p>
        )}
        {business.phone && (
          <p className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
            <a href={`tel:${business.phone}`} className="hover:underline">
              {business.phone}
            </a>
          </p>
        )}
      </div>

      {business.services && business.services.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-semibold">Services</h2>
          <ul className="space-y-2">
            {business.services.map((s) => (
              <li key={s.name} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {analytics && (
        <section className="mb-8 rounded-xl border border-[var(--border)] p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" />
            Business analytics
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{analytics.viewCount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Profile views</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.inquiryCount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Inquiries</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.listingViews}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Listing views</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Visible to business owners — full dashboard in Phase 6.
          </p>
        </section>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-medium">Contact</h3>
          <InquiryForm businessId={business.id} />
        </div>
        <div>
          <h3 className="mb-2 font-medium">Request a quote</h3>
          <InquiryForm businessId={business.id} quoteRequest />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-semibold">Reviews</h2>
        <ReviewSection businessId={business.id} reviews={reviews} />
      </section>

      <div className="mt-8">
        <Link href="/map">
          <Button variant="outline">View on map</Button>
        </Link>
      </div>
    </PageTransition>
  );
}

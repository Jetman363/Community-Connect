"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommunityImage } from "@/components/ui/community-image";
import { InquiryForm } from "@/components/marketplace/inquiry-form";
import { TrustPanel } from "@/components/marketplace/trust-panel";
import { SellerBadgeRow } from "@/components/marketplace/seller-badge";
import { RelativeTime } from "@/components/ui/relative-time";
import { useToast } from "@/components/ui/toast";
import type { MarketplaceListingDto } from "@/types/marketplace";
import {
  MapPin,
  Share2,
  UserPlus,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const conditionColors: Record<string, string> = {
  Excellent: "bg-emerald-500/15 text-emerald-700",
  "Like New": "bg-blue-500/15 text-blue-700",
  Good: "bg-amber-500/15 text-amber-700",
  Fair: "bg-orange-500/15 text-orange-700",
};

export function ListingDetailModal({
  listing,
  onClose,
  isOwner,
}: {
  listing: MarketplaceListingDto | null;
  onClose: () => void;
  isOwner?: boolean;
}) {
  const { toast } = useToast();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [following, setFollowing] = useState(false);
  const [sold, setSold] = useState(false);

  if (!listing) return null;

  const photos =
    listing.imageGallery.length > 0
      ? listing.imageGallery
      : listing.imageUrl
        ? [listing.imageUrl]
        : [];

  const prevPhoto = () => setPhotoIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  const nextPhoto = () => setPhotoIndex((i) => (i < photos.length - 1 ? i + 1 : 0));

  return (
    <Modal open={!!listing} onClose={onClose} title={listing.title}>
      <div className="space-y-4">
        {photos.length > 0 && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-[var(--muted)]">
            <CommunityImage
              src={photos[photoIndex]}
              alt={`${listing.title} photo ${photoIndex + 1}`}
              fill
              className="object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        i === photoIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{listing.type.replace("_", " ")}</Badge>
          {listing.condition && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                conditionColors[listing.condition] ?? "bg-[var(--muted)]"
              )}
            >
              {listing.condition}
            </span>
          )}
          {listing.classifiedType && (
            <Badge>{listing.classifiedType.replace("_", " ")}</Badge>
          )}
          {sold && <Badge variant="default">Sold</Badge>}
        </div>

        {listing.price != null && (
          <p className="text-2xl font-bold">
            {listing.price === 0 ? "Free" : `$${listing.price}`}
            {listing.negotiable && listing.price > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                negotiable
              </span>
            )}
          </p>
        )}

        <p className="text-sm leading-relaxed">{listing.description}</p>

        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <MapPin className="h-4 w-4" />
          {listing.locationLabel ?? "Local pickup"}
        </div>

        <SellerBadgeRow seller={listing.seller} />
        <p className="text-xs text-[var(--muted-foreground)]">
          Posted <RelativeTime date={listing.createdAt} /> · {listing.viewCount} views
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href);
              toast("Link copied!", "success");
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              setFollowing(!following);
              toast(following ? "Unfollowed seller" : "Following seller", "success");
            }}
          >
            <UserPlus className="h-4 w-4" />
            {following ? "Following" : "Follow seller"}
          </Button>
          <Link href="/messages">
            <Button variant="outline" size="sm" className="gap-1">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          </Link>
        </div>

        {isOwner && !sold && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                setSold(true);
                toast("Listing marked as sold", "success");
              }}
            >
              <CheckCircle className="h-4 w-4" />
              Mark sold
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => toast("Listing renewed for 30 days", "success")}
            >
              <RefreshCw className="h-4 w-4" />
              Renew listing
            </Button>
          </div>
        )}

        {!sold && <InquiryForm listingId={listing.id} />}

        <TrustPanel onReport={() => toast("Report submitted — our team will review", "info")} />

        <Link href="/map?layer=listings" className="text-sm text-[var(--accent)] hover:underline">
          View on map
        </Link>
      </div>
    </Modal>
  );
}

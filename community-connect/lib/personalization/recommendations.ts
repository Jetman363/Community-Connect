import { mockDeals } from "@/lib/mock-data/deals";
import { mockEvents } from "@/lib/mock-data/events";
import { mockGroups } from "@/lib/mock-data/groups";
import { mockNewsArticles } from "@/lib/mock-data/news";
import { mockListings } from "@/lib/mock-data/marketplace";
import { communityPhotos } from "@/lib/images/community-photos";
import {
  filterByRadius,
  haversineMiles,
  interestBoost,
  type GeoFilterOptions,
} from "@/lib/personalization/geo-engine";
import type { ForYouRecommendation } from "@/types/radius";
import type { BehaviorEventType } from "@prisma/client";

interface ScorableEntity {
  id: string;
  entityType: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  lat?: number | null;
  lng?: number | null;
  baseScore?: number;
}

const MOCK_ENTITIES: ScorableEntity[] = [
  ...mockEvents.map((e) => ({
    id: e.id,
    entityType: "event",
    title: e.title,
    subtitle: e.location,
    imageUrl: e.imageUrl,
    href: `/events`,
    lat: e.lat,
    lng: e.lng,
    baseScore: 70,
  })),
  ...mockDeals.map((d) => ({
    id: d.id,
    entityType: "deal",
    title: d.title,
    subtitle: d.businessName,
    imageUrl: d.imageUrl ?? undefined,
    href: `/deals`,
    baseScore: 65,
  })),
  ...mockGroups.map((g) => ({
    id: g.id,
    entityType: "group",
    title: g.name,
    subtitle: g.category,
    imageUrl: g.coverPhoto ?? undefined,
    href: `/groups/${g.id}`,
    baseScore: 55,
  })),
  ...mockNewsArticles.slice(0, 5).map((n) => ({
    id: n.id,
    entityType: "news",
    title: n.title,
    subtitle: n.source,
    imageUrl: n.imageUrl ?? undefined,
    href: `/news`,
    baseScore: 50,
  })),
  ...mockListings.slice(0, 5).map((l) => ({
    id: l.id,
    entityType: "marketplace",
    title: l.title,
    subtitle: l.location,
    imageUrl: l.imageUrl ?? undefined,
    href: `/marketplace/${l.id}`,
    baseScore: 60,
  })),
  {
    id: "alert-nearby",
    entityType: "alert",
    title: "Community safety update",
    subtitle: "Moderate traffic advisory",
    imageUrl: communityPhotos.hero.alerts,
    href: "/alerts",
    baseScore: 40,
  },
];

interface BehaviorWeight {
  entityType: string;
  entityId?: string;
  count: number;
}

function behaviorBoost(
  entityType: string,
  entityId: string,
  behaviors: BehaviorWeight[]
): number {
  let boost = 0;
  for (const b of behaviors) {
    if (b.entityType === entityType) boost += b.count * 3;
    if (b.entityId === entityId) boost += b.count * 8;
  }
  return boost;
}

function distanceScore(distanceMiles: number, radiusMiles: number): number {
  if (!Number.isFinite(distanceMiles)) return 0;
  const ratio = distanceMiles / radiusMiles;
  if (ratio >= 1) return 0;
  return Math.round(20 * (1 - ratio));
}

export function scoreRecommendations(input: {
  interests: string[];
  centerLat?: number;
  centerLng?: number;
  radiusMiles?: number;
  behaviors?: Array<{ eventType: BehaviorEventType; entityType: string; entityId?: string | null }>;
  limit?: number;
}): ForYouRecommendation[] {
  const radiusMiles = input.radiusMiles ?? 10;
  const limit = input.limit ?? 12;

  const behaviorWeights: BehaviorWeight[] = [];
  for (const b of input.behaviors ?? []) {
    const existing = behaviorWeights.find(
      (w) => w.entityType === b.entityType && w.entityId === (b.entityId ?? undefined)
    );
    if (existing) existing.count += 1;
    else behaviorWeights.push({ entityType: b.entityType, entityId: b.entityId ?? undefined, count: 1 });
  }

  let candidates = MOCK_ENTITIES;

  if (input.centerLat != null && input.centerLng != null) {
    const filtered = filterByRadius(
      MOCK_ENTITIES.filter((e) => e.lat != null && e.lng != null),
      {
        centerLat: input.centerLat,
        centerLng: input.centerLng,
        radiusMiles: radiusMiles * 1.5,
      }
    );
    const filteredIds = new Set(filtered.map((f) => f.item.id));
    const inRadius = filtered.map((f) => f.item);
    const noCoords = MOCK_ENTITIES.filter((e) => e.lat == null || e.lng == null);
    const outOfRadius = MOCK_ENTITIES.filter(
      (e) => e.lat != null && e.lng != null && !filteredIds.has(e.id)
    );
    candidates = [...inRadius, ...noCoords, ...outOfRadius.slice(0, 3)];
  }

  const scored: ForYouRecommendation[] = candidates.map((entity) => {
    let score = entity.baseScore ?? 50;
    score += interestBoost(entity.entityType, input.interests);
    score += behaviorBoost(entity.entityType, entity.id, behaviorWeights);

    let distanceMiles: number | undefined;
    if (
      input.centerLat != null &&
      input.centerLng != null &&
      entity.lat != null &&
      entity.lng != null
    ) {
      distanceMiles = haversineMiles(input.centerLat, input.centerLng, entity.lat, entity.lng);
      score += distanceScore(distanceMiles, radiusMiles);
    }

    const topInterest = input.interests[0] ?? "community";
    const reason =
      distanceMiles != null && distanceMiles < radiusMiles
        ? `${Math.round(distanceMiles * 10) / 10} mi away · matches ${topInterest}`
        : `Recommended for your ${topInterest} interests`;

    return {
      id: `${entity.entityType}-${entity.id}`,
      entityType: entity.entityType,
      entityId: entity.id,
      title: entity.title,
      subtitle: entity.subtitle,
      imageUrl: entity.imageUrl,
      href: entity.href,
      score,
      reason,
      distanceMiles,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getGeoFilterOptions(
  lat?: number | null,
  lng?: number | null,
  radiusMiles?: number
): GeoFilterOptions | null {
  if (lat == null || lng == null) return null;
  return { centerLat: lat, centerLng: lng, radiusMiles };
}

"use client";

import { PageTransition } from "@/components/ui/page-header";
import { WelcomeHeader, WeatherWidget } from "@/components/dashboard/welcome-header";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { FeedPreview } from "@/components/dashboard/feed-preview";
import { EventsCarousel } from "@/components/dashboard/events-carousel";
import { NearbyServices } from "@/components/dashboard/nearby-services";
import { MapPlaceholder } from "@/components/ui/map-placeholder";

export default function DashboardPage() {
  return (
    <PageTransition>
      <WelcomeHeader />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MapPlaceholder label="Community map" height="h-48" />
          <AlertsPanel />
          <FeedPreview />
          <EventsCarousel />
        </div>

        <div className="space-y-6">
          <WeatherWidget />
          <NearbyServices />
        </div>
      </div>
    </PageTransition>
  );
}

"use client";

import { PageTransition } from "@/components/ui/page-header";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { WelcomeHeader, WeatherWidget } from "@/components/dashboard/welcome-header";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { FeedPreview } from "@/components/dashboard/feed-preview";
import { EventsCarousel } from "@/components/dashboard/events-carousel";
import { NearbyServices } from "@/components/dashboard/nearby-services";

export default function DashboardPage() {
  return (
    <PageTransition>
      <WelcomeHeader />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeatherWidget />
        </div>
        <MapPlaceholder label="Community overview map" height="h-full min-h-[120px]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <AlertsPanel />
        <EventsCarousel />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <FeedPreview />
        <NearbyServices />
      </div>
    </PageTransition>
  );
}

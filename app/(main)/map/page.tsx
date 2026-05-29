"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasMapsKey, mapsEmbedUrl } from "@/lib/maps";

export default function MapPage() {
  const lat = 37.7749;
  const lng = -122.4194;
  const embed = mapsEmbedUrl(lat, lng);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Community Map</h1>
      {!hasMapsKey() && (
        <Badge variant="default">Demo mode — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for live maps</Badge>
      )}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {embed ? (
            <iframe
              title="Community map"
              src={embed}
              className="h-[400px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]">
              <div className="text-center">
                <p className="font-medium">Map placeholder</p>
                <p className="mt-1 text-sm">Alerts & reports at {lat.toFixed(4)}, {lng.toFixed(4)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

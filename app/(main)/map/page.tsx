"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { LayerControls } from "@/components/map/layer-controls";
import { MapCanvas } from "@/components/map/map-canvas";
import { IncidentCard } from "@/components/map/incident-card";
import { MarkerClusterPlaceholder } from "@/components/map/marker-cluster-placeholder";
import { useMapMarkers } from "@/hooks/use-map-markers";
import type { MapMarkerDto } from "@/types/safety";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation, Loader2 } from "lucide-react";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/loader";

export default function MapPage() {
  const [layer, setLayer] = useState("all");
  const [selected, setSelected] = useState<MapMarkerDto | null>(null);
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);
  const [radiusKm, setRadiusKm] = useState(2);
  const [locating, setLocating] = useState(false);
  const { markers, loading } = useMapMarkers({ layers: layer });

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <PageTransition>
      <PageHeader
        title="Community Map"
        description="Alerts, incidents, events, and local services"
      />

      <LayerControls value={layer} onChange={setLayer} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleLocate} disabled={locating}>
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          My location
        </Button>
        <label className="flex items-center gap-2 text-sm">
          Radius (km)
          <Input
            type="number"
            min={0.5}
            max={25}
            step={0.5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-20 h-8"
          />
        </label>
        <MarkerClusterPlaceholder count={markers.length} />
      </div>

      <div className="relative mb-6">
        <MapCanvas
          markers={markers}
          center={center}
          className="h-[55vh] min-h-[280px]"
          onMarkerClick={setSelected}
        />
        {selected && (
          <IncidentCard marker={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading markers…</p>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]">
          {markers.length} markers in view · radius filter {radiusKm} km (API bbox on pan coming soon)
        </p>
      )}
    </PageTransition>
  );
}

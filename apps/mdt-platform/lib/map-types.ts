export type MapMarkerKind = "incident" | "unit" | "officer" | "call";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  kind: MapMarkerKind;
  priority?: string;
  status?: string;
  selected?: boolean;
}

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

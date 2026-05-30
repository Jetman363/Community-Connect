export interface ReverseGeocodeResult {
  formatted: string;
  neighborhood?: string;
  city?: string;
  source: "google" | "placeholder";
}

/** Reverse geocode — uses Google Geocoding API when GOOGLE_MAPS_KEY is set. */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const key = process.env.GOOGLE_MAPS_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    return {
      formatted: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      source: "placeholder",
    };
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", key);
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    const data = (await res.json()) as {
      status: string;
      results?: { formatted_address: string; address_components: { long_name: string; types: string[] }[] }[];
    };
    if (data.status !== "OK" || !data.results?.[0]) {
      return { formatted: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, source: "placeholder" };
    }
    const r = data.results[0];
    const neighborhood = r.address_components.find((c) => c.types.includes("neighborhood"))?.long_name;
    const city = r.address_components.find((c) => c.types.includes("locality"))?.long_name;
    return {
      formatted: r.formatted_address,
      neighborhood,
      city,
      source: "google",
    };
  } catch {
    return { formatted: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, source: "placeholder" };
  }
}

import { describe, it, expect } from "vitest";
import {
  haversineMiles,
  withinRadiusMiles,
  filterByRadius,
  interestBoost,
  milesToMeters,
} from "@/lib/personalization/geo-engine";

describe("geo-engine", () => {
  it("converts miles to meters", () => {
    expect(milesToMeters(1)).toBeCloseTo(1609.344, 0);
  });

  it("computes haversine miles", () => {
    const miles = haversineMiles(30.2672, -97.7431, 30.2772, -97.7431);
    expect(miles).toBeGreaterThan(0.5);
    expect(miles).toBeLessThan(1.5);
  });

  it("filters items within radius", () => {
    const items = [
      { id: "near", lat: 30.27, lng: -97.74 },
      { id: "far", lat: 31.0, lng: -97.74 },
    ];
    const filtered = filterByRadius(items, {
      centerLat: 30.2672,
      centerLng: -97.7431,
      radiusMiles: 10,
    });
    expect(filtered.some((f) => f.item.id === "near")).toBe(true);
    expect(filtered.some((f) => f.item.id === "far")).toBe(false);
  });

  it("withinRadiusMiles returns true for nearby points", () => {
    expect(withinRadiusMiles(30.2672, -97.7431, 30.268, -97.743, 5)).toBe(true);
  });

  it("interestBoost adds score for matching interests", () => {
    expect(interestBoost("deal", ["deals", "food"])).toBeGreaterThan(0);
    expect(interestBoost("unknown", [])).toBe(0);
  });
});

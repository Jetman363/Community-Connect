import { describe, it, expect } from "vitest";
import { haversineMeters, withinRadiusM, bboxFromCenter } from "@/lib/geo/distance";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it("computes approximate NYC to LA distance", () => {
    const meters = haversineMeters(40.7128, -74.006, 34.0522, -118.2437);
    expect(meters).toBeGreaterThan(3_900_000);
    expect(meters).toBeLessThan(4_000_000);
  });
});

describe("withinRadiusM", () => {
  it("returns true when inside radius", () => {
    expect(withinRadiusM(40.7128, -74.006, 40.7129, -74.006, 500)).toBe(true);
  });
});

describe("bboxFromCenter", () => {
  it("returns symmetric bounds", () => {
    const box = bboxFromCenter(0, 0, 1000);
    expect(box.minLat).toBeLessThan(0);
    expect(box.maxLat).toBeGreaterThan(0);
  });
});

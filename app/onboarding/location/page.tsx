"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeolocation } from "@/hooks/use-geolocation";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { MapPin, Navigation, Shield } from "lucide-react";

const BENEFITS = [
  "See deals and events near you",
  "Get safety alerts for your area",
  "Discover neighbors and local businesses",
  "Personalize your Radius feed",
];

export default function OnboardingLocationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const geo = useGeolocation();
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [precise, setPrecise] = useState(true);
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  async function saveAndContinue(skip = false) {
    setSaving(true);
    try {
      if (!skip) {
        geo.setManualLocation({ city, state, zip, precise, sharingEnabled });
        const loc = geo.resolvedLocation();
        await apiFetch("/api/user/location", {
          method: "POST",
          body: JSON.stringify({
            ...loc,
            precise,
            sharingEnabled,
          }),
        });
      }
      router.push("/onboarding/interests");
    } catch {
      toast("Saved locally — continuing setup", "info");
      router.push("/onboarding/interests");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Where are you?</h2>
      <p className="text-body mb-6 text-[var(--muted-foreground)]">
        Radius works best when we know your location.
      </p>

      <ul className="mb-6 space-y-2">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
            {b}
          </li>
        ))}
      </ul>

      <Button
        type="button"
        className="mb-4 w-full"
        size="lg"
        onClick={() => geo.requestLocation()}
        disabled={geo.loading}
      >
        <Navigation className="mr-2 h-4 w-4" />
        {geo.loading ? "Getting location…" : "Use my current location"}
      </Button>

      {geo.lat != null && (
        <p className="mb-4 text-sm text-[var(--accent)]">
          GPS: {geo.lat.toFixed(4)}, {geo.lng?.toFixed(4)}
        </p>
      )}

      {geo.error && (
        <p className="mb-4 text-sm text-[var(--emergency)]">{geo.error}</p>
      )}

      <p className="mb-3 text-sm font-medium">Or enter manually</p>
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="TX" />
        </div>
        <div>
          <Label htmlFor="zip">ZIP</Label>
          <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="78701" />
        </div>
      </div>

      <div className="mb-6 space-y-3 rounded-xl border border-[var(--border)] p-4">
        <label className="flex items-center justify-between text-sm">
          <span>Use precise location</span>
          <input
            type="checkbox"
            checked={precise}
            onChange={(e) => setPrecise(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Share location with community
          </span>
          <input
            type="checkbox"
            checked={sharingEnabled}
            onChange={(e) => setSharingEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
        </label>
        <p className="text-xs text-[var(--muted-foreground)]">
          You can update location and privacy anytime in Settings.
        </p>
      </div>

      <Button className="w-full" size="lg" onClick={() => void saveAndContinue()} disabled={saving}>
        {saving ? "Saving…" : "Continue"}
      </Button>
      <button
        type="button"
        onClick={() => void saveAndContinue(true)}
        className="mt-3 w-full text-center text-sm text-[var(--muted-foreground)] hover:underline"
      >
        Skip for now
      </button>
      <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
        Already have an account? <Link href="/login" className="text-[var(--accent)]">Sign in</Link>
      </p>
    </div>
  );
}

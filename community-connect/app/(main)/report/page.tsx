"use client";

import { useState, useCallback, useEffect } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilterChips } from "@/components/ui/filter-chips";
import { useToast } from "@/components/ui/toast";
import { apiFetch, uploadFile } from "@/lib/api/client";
import type { IncidentReportDto } from "@/types/safety";
import { Camera, MapPin, AlertTriangle, Loader2, Sparkles, EyeOff } from "lucide-react";
import { MapFallback } from "@/components/map/map-fallback";
import { isMapsAvailable } from "@/lib/maps/loader";

const categories = [
  { id: "HAZARD", label: "Hazard" },
  { id: "CRIME", label: "Crime" },
  { id: "MAINTENANCE", label: "Maintenance" },
  { id: "NOISE", label: "Noise" },
  { id: "TRAFFIC", label: "Traffic" },
  { id: "OTHER", label: "Other" },
] as const;

const severities = [
  { id: "LOW", label: "Low" },
  { id: "MODERATE", label: "Moderate" },
  { id: "HIGH", label: "High" },
  { id: "CRITICAL", label: "Critical" },
] as const;

export default function ReportPage() {
  const [category, setCategory] = useState<string>("HAZARD");
  const [severity, setSeverity] = useState<string>("MODERATE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [tracked, setTracked] = useState<IncidentReportDto | null>(null);
  const { toast } = useToast();

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        try {
          const geo = await apiFetch<{ formatted: string }>(
            `/api/geo/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          setLocationLabel(geo.formatted);
        } catch {
          setLocationLabel(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        }
      },
      () => toast("Could not detect location", "error")
    );
  }, [toast]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  useEffect(() => {
    if (title.length < 5 && description.length < 20) {
      setSuggested(null);
      return;
    }
    const t = setTimeout(() => {
      const text = `${title} ${description}`.toLowerCase();
      if (/crime|theft/i.test(text)) setSuggested("CRIME");
      else if (/noise/i.test(text)) setSuggested("NOISE");
      else if (/repair|broken|maintenance/i.test(text)) setSuggested("MAINTENANCE");
      else if (/hazard|danger/i.test(text)) setSuggested("HAZARD");
      else setSuggested("OTHER");
    }, 600);
    return () => clearTimeout(t);
  }, [title, description]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 3)) {
      try {
        const up = await uploadFile(file, "report");
        setMediaUrls((prev) => [...prev, up.url]);
      } catch {
        toast("Upload failed", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const report = await apiFetch<IncidentReportDto>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          anonymous,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          locationLabel: locationLabel ?? undefined,
          mediaUrls,
        }),
      });
      toast("Report submitted successfully", "success");
      setTrackId(report.id);
      setTracked(report);
      setTitle("");
      setDescription("");
      setMediaUrls([]);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Submit failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Submit Report"
        description="Report issues, hazards, or concerns to public safety and moderators"
      />

      <div className="mx-auto max-w-2xl">
        <Card className="mb-6 border-[var(--emergency)]/20">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-[var(--emergency)]" />
            <p className="text-sm">
              For emergencies, call <strong>911</strong>. This form is for non-emergency community reports.
            </p>
          </CardContent>
        </Card>

        {tracked && trackId && (
          <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 text-sm">
              <p className="font-medium">Report #{trackId.slice(0, 8)} — {tracked.status}</p>
              {tracked.suggestedCategory && (
                <p className="mt-1 text-[var(--muted-foreground)]">
                  AI suggested category: {tracked.suggestedCategory}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-3 block">Category</Label>
            <FilterChips options={[...categories]} value={category} onChange={setCategory} />
            {suggested && suggested !== category && (
              <button
                type="button"
                className="mt-2 flex items-center gap-1 text-xs text-[var(--accent)]"
                onClick={() => setCategory(suggested)}
              >
                <Sparkles className="h-3 w-3" />
                Suggested: {suggested} — tap to apply
              </button>
            )}
          </div>

          <div>
            <Label className="mb-3 block">Severity</Label>
            <FilterChips options={[...severities]} value={severity} onChange={setSeverity} />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="rounded"
            />
            <EyeOff className="h-4 w-4" />
            Submit anonymously (your identity hidden from the public)
          </label>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Details</Label>
            <Textarea
              id="description"
              placeholder="Provide as much detail as possible..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <Label className="mb-2 block">Location</Label>
            {isMapsAvailable() ? (
              <div className="rounded-2xl border border-[var(--border)] p-4 text-sm">
                <p className="flex items-center gap-1 text-[var(--muted-foreground)]">
                  <MapPin className="h-4 w-4" />
                  {locationLabel ?? "Detecting…"}
                </p>
                {lat != null && lng != null && (
                  <p className="mt-1 text-xs">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                )}
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={detectLocation}>
                  Refresh GPS
                </Button>
              </div>
            ) : (
              <MapFallback label="Map pin picker" height="h-40" hint="Add Google Maps key for drag-pin UI." />
            )}
          </div>

          <div>
            <Label htmlFor="photos" className="mb-2 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos / video
            </Label>
            <Input id="photos" type="file" accept="image/*,video/*" multiple onChange={handleFile} />
            {mediaUrls.length > 0 && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{mediaUrls.length} file(s) attached</p>
            )}
          </div>

          <Button type="submit" variant="danger" className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit Report
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}

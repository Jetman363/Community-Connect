"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function ReportPage() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [aiCategory, setAiCategory] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  function captureGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok && data.file?.url) {
      setMediaUrls((prev) => [...prev, data.file.url]);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...coords, mediaUrls }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(data.report?.status ?? "SUBMITTED");
      setAiCategory(data.report?.aiCategory ?? null);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Report an Issue</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Community reporting center</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea placeholder="Describe the issue…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <Button type="button" variant="outline" onClick={captureGps}>
              {coords ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Capture GPS location"}
            </Button>
            <div>
              <input type="file" accept="image/*" className="text-sm" onChange={handleFileChange} disabled={uploading} />
              {mediaUrls.length > 0 && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{mediaUrls.length} photo(s) attached</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>Submit report</Button>
          </form>
          {status && (
            <div className="mt-4 space-y-2">
              <Badge variant="success">Status: {status}</Badge>
              {aiCategory && <Badge variant="accent">AI category: {aiCategory}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

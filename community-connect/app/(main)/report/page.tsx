"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilterChips } from "@/components/ui/filter-chips";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { useToast } from "@/components/ui/toast";
import { Camera, MapPin, AlertTriangle } from "lucide-react";

const categories = [
  { id: "hazard", label: "Hazard" },
  { id: "crime", label: "Crime" },
  { id: "maintenance", label: "Maintenance" },
  { id: "noise", label: "Noise" },
  { id: "other", label: "Other" },
] as const;

type Category = (typeof categories)[number]["id"];

export default function ReportPage() {
  const [category, setCategory] = useState<Category>("hazard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Report submitted successfully", "success");
    setTitle("");
    setDescription("");
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-3 block">Category</Label>
            <FilterChips options={[...categories]} value={category} onChange={setCategory} />
          </div>

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
            <MapPlaceholder label="Tap to set location" height="h-40" />
            <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <MapPin className="h-3 w-3" />
              Location picker available in Phase 3
            </p>
          </div>

          <Button type="button" variant="outline" className="w-full">
            <Camera className="h-4 w-4" />
            Add Photos (Phase 3)
          </Button>

          <Button type="submit" variant="danger" className="w-full" size="lg">
            Submit Report
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}

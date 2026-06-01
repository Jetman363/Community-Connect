"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";
import { usePersonalization } from "@/hooks/use-personalization";
import { RADIUS_PRESETS } from "@/config/interests";
import type { PrivacySettingsDto } from "@/types/radius";
import { ArrowLeft, Download, MapPin, Shield, Trash2 } from "lucide-react";

export default function PrivacySettingsPage() {
  const { toast } = useToast();
  const { preferences, updatePreferences } = usePersonalization();
  const [privacy, setPrivacy] = useState<PrivacySettingsDto | null>(null);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    void apiFetch<PrivacySettingsDto>("/api/user/privacy")
      .then(setPrivacy)
      .catch(() => undefined);
  }, []);

  async function savePrivacy(patch: Partial<PrivacySettingsDto>) {
    try {
      const updated = await apiFetch<PrivacySettingsDto>("/api/user/privacy", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setPrivacy(updated);
      toast("Privacy settings saved", "success");
    } catch {
      setPrivacy((p) => (p ? { ...p, ...patch } : p));
      toast("Saved locally", "info");
    }
  }

  async function exportData() {
    try {
      const data = await apiFetch<unknown>("/api/user/export-data", { method: "POST" });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "radius-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast("Data export downloaded", "success");
    } catch {
      toast("Export failed", "error");
    }
  }

  async function requestDeletion() {
    try {
      await apiFetch("/api/user/delete-account", {
        method: "POST",
        body: JSON.stringify({ confirmEmail: deleteEmail }),
      });
      toast("Deletion request submitted (30-day grace period)", "info");
      setShowDeleteModal(false);
    } catch {
      toast("Deletion request failed", "error");
    }
  }

  const p = privacy ?? {
    locationSharingEnabled: true,
    preciseLocation: false,
    profileVisibility: "community",
    searchVisibility: "community",
    activityVisibility: "community",
    communityVisibility: "community",
  };

  return (
    <PageTransition>
      <PageHeader
        title="Privacy & Location"
        description="Control how Radius uses your data"
        action={
          <Link href="/settings" className="text-sm text-[var(--accent)] flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Settings
          </Link>
        }
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <CardTitle className="text-base">Location</CardTitle>
                <CardDescription>Radius uses location for nearby content</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              label="Share location with community"
              checked={p.locationSharingEnabled}
              onChange={(v) => void savePrivacy({ locationSharingEnabled: v })}
            />
            <ToggleRow
              label="Use precise GPS location"
              checked={p.preciseLocation}
              onChange={(v) => void savePrivacy({ preciseLocation: v })}
            />
            <div>
              <Label className="mb-2 block">Discovery radius (miles)</Label>
              <div className="flex flex-wrap gap-2">
                {RADIUS_PRESETS.map((miles) => (
                  <button
                    key={miles}
                    type="button"
                    onClick={() => void updatePreferences({ radiusMiles: miles })}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      (preferences?.radiusMiles ?? 10) === miles
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--muted)]"
                    }`}
                  >
                    {miles} mi
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <CardTitle className="text-base">Visibility</CardTitle>
                <CardDescription>Who can see your profile and activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["profileVisibility", "Profile"],
                ["searchVisibility", "Search results"],
                ["activityVisibility", "Activity"],
                ["communityVisibility", "Community posts"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm">{label}</span>
                <select
                  value={p[key]}
                  onChange={(e) =>
                    void savePrivacy({ [key]: e.target.value } as Partial<PrivacySettingsDto>)
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="community">Community</option>
                  <option value="private">Private</option>
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your data</CardTitle>
            <CardDescription>Export or delete your Radius account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => void exportData()}>
              <Download className="mr-2 h-4 w-4" />
              Download my data
            </Button>
            <Separator />
            <Button variant="danger" className="w-full justify-start" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete account?</CardTitle>
              <CardDescription>
                This schedules deletion after a 30-day grace period. Enter your email to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => void requestDeletion()}>
                  Confirm deletion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[var(--muted)]">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--accent)]"
      />
    </label>
  );
}

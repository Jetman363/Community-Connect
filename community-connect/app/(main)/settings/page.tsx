"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/providers/theme-provider";
import { currentUser } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client";
import {
  User,
  Bell,
  Shield,
  Palette,
  Link2,
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersonalization } from "@/hooks/use-personalization";
import { ConnectedAccountsSettings } from "@/components/social/connected-accounts-settings";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");

  useEffect(() => {
    void apiFetch<{ mfaEnabled: boolean }>("/api/users/me/mfa")
      .then((d) => setMfaEnabled(d.mfaEnabled))
      .catch(() => undefined);
  }, []);

  async function toggleMfa() {
    try {
      const res = await apiFetch<{ mfaEnabled?: boolean; message?: string; status?: string }>(
        "/api/users/me/mfa",
        { method: "PATCH", body: JSON.stringify({ enabled: !mfaEnabled }) }
      );
      if (res.status === "setup_required") {
        toast(res.message ?? "MFA setup required", "info");
      } else {
        setMfaEnabled(res.mfaEnabled ?? false);
        toast(mfaEnabled ? "MFA disabled" : "MFA enabled", "success");
      }
    } catch {
      toast("MFA update failed", "error");
    }
  }

  async function exportData() {
    try {
      const data = await apiFetch<unknown>("/api/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "community-connect-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast("Data export downloaded", "success");
    } catch {
      toast("Export failed — sign in required", "error");
    }
  }

  async function requestDeletion() {
    if (!deleteEmail) {
      toast("Enter your email to confirm", "error");
      return;
    }
    try {
      await apiFetch("/api/users/me/delete", {
        method: "POST",
        body: JSON.stringify({ confirmEmail: deleteEmail }),
      });
      toast("Deletion request submitted (30-day grace period)", "info");
    } catch {
      toast("Deletion request failed", "error");
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Settings"
        description="Manage your account, privacy, and preferences"
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <SettingsSection icon={User} title="Account" description="Your personal information">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue={currentUser.displayName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="resident@communityconnect.app" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" defaultValue={currentUser.bio} />
            </div>
            <Button onClick={() => toast("Profile saved", "success")}>Save Changes</Button>
          </div>
        </SettingsSection>

        <SettingsSection icon={Bell} title="Notifications" description="Control how you receive alerts">
          <div className="space-y-3">
            <ToggleRow label="Emergency alerts" defaultChecked />
            <ToggleRow label="Community posts" defaultChecked />
            <ToggleRow label="Event reminders" defaultChecked />
            <ToggleRow label="Marketplace messages" />
            <ToggleRow label="Email digest" defaultChecked />
          </div>
        </SettingsSection>

        <SettingsSection icon={Palette} title="Interests" description="Personalize your feed and recommendations">
          <InterestTags />
        </SettingsSection>

        <SettingsSection icon={Palette} title="Appearance" description="Theme and display preferences">
          <div className="flex gap-2">
            {(
              [
                { value: "light" as const, icon: Sun, label: "Light" },
                { value: "dark" as const, icon: Moon, label: "Dark" },
                { value: "system" as const, icon: Monitor, label: "System" },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  theme === value
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)] hover:bg-[var(--muted)]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection icon={Shield} title="Security" description="Password and authentication">
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => void toggleMfa()}>
              Two-Factor Authentication {mfaEnabled ? "(enabled)" : "(disabled)"}
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Active Sessions
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection icon={Shield} title="Privacy & Data" description="Export or delete your account data">
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => void exportData()}>
              <Download className="mr-2 h-4 w-4" />
              Download my data (GDPR export)
            </Button>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="delete-email">Confirm email to request account deletion</Label>
              <Input
                id="delete-email"
                type="email"
                placeholder="your@email.com"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
            </div>
            <Button variant="danger" className="w-full justify-start" onClick={() => void requestDeletion()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Request account deletion
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={Link2}
          title="Connected Accounts"
          description="Link social profiles shown on your public profile"
        >
          <ConnectedAccountsSettings />
        </SettingsSection>
      </div>
    </PageTransition>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[var(--muted)]">
      <span className="text-sm">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--accent)]" />
    </label>
  );
}

const INTEREST_OPTIONS = [
  "events",
  "deals",
  "family",
  "food",
  "outdoors",
  "social",
  "sports",
  "news",
  "volunteering",
];

function InterestTags() {
  const { profile, updateInterests } = usePersonalization();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(profile.interests);

  useEffect(() => {
    setSelected(profile.interests);
  }, [profile.interests]);

  function toggle(topic: string) {
    setSelected((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  async function save() {
    await updateInterests(selected);
    toast("Interests saved — feed will update", "success");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => toggle(topic)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm capitalize transition-colors",
              selected.includes(topic)
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {topic}
          </button>
        ))}
      </div>
      <Button onClick={() => void save()}>Save Interests</Button>
    </div>
  );
}

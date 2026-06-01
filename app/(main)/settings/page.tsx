"use client";

import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/providers/theme-provider";
import { currentUser } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";
import {
  User,
  Bell,
  Shield,
  Palette,
  Link2,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

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
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Active Sessions
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection icon={Link2} title="Connected Accounts" description="Linked social and service accounts">
          <div className="space-y-3">
            <ConnectedRow provider="Google" connected />
            <ConnectedRow provider="Apple" />
            <ConnectedRow provider="Facebook" />
          </div>
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

function ConnectedRow({ provider, connected }: { provider: string; connected?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
      <span className="text-sm font-medium">{provider}</span>
      <Button size="sm" variant={connected ? "secondary" : "outline"}>
        {connected ? "Connected" : "Connect"}
      </Button>
    </div>
  );
}

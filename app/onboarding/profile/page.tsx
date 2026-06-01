"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      if (username || bio || avatarUrl) {
        await apiFetch("/api/user/profile", {
          method: "PATCH",
          body: JSON.stringify({
            username: username || undefined,
            bio: bio || undefined,
            avatarUrl: avatarUrl || undefined,
          }),
        });
      }
      await apiFetch("/api/personalization/onboarding-complete", { method: "POST" });
      toast("Welcome to Radius!", "success");
      router.push("/dashboard");
    } catch {
      toast("Welcome to Radius!", "success");
      document.cookie = "cc_onboarded=1; path=/; max-age=31536000";
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Complete your profile</h2>
      <p className="text-body mb-6 text-[var(--muted-foreground)]">
        Optional — help neighbors recognize you on Radius.
      </p>

      <div className="mb-6 flex flex-col items-center gap-3">
        {avatarUrl ? (
          <Avatar src={avatarUrl} initials="?" size="lg" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)]">
            <User className="h-8 w-8 text-[var(--muted-foreground)]" />
          </div>
        )}
        <div className="w-full">
          <Label htmlFor="avatar">Profile photo URL (optional)</Label>
          <Input
            id="avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="mb-4 grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="alex_neighbor"
          pattern="^[a-zA-Z0-9_]+$"
        />
      </div>

      <div className="mb-6 grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Input
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Oak Hills resident, dog lover…"
        />
      </div>

      <Button className="w-full" size="lg" onClick={() => void finish()} disabled={saving}>
        {saving ? "Finishing…" : "Enter Radius"}
      </Button>
      <button
        type="button"
        onClick={() => void finish()}
        className="mt-3 w-full text-center text-sm text-[var(--muted-foreground)] hover:underline"
      >
        Skip and go to dashboard
      </button>
    </div>
  );
}

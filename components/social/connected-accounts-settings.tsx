"use client";

import { useState } from "react";
import type { SocialPlatform } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useSocialLinks } from "@/hooks/use-social-links";
import { SOCIAL_PLATFORMS } from "@/types/social";
import { SocialPlatformIcon } from "@/components/social/social-platform-icon";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function ConnectedAccountsSettings() {
  const { links, loading, connect, disconnect, setPlatformPublic } = useSocialLinks();
  const { toast } = useToast();
  const [editing, setEditing] = useState<SocialPlatform | null>(null);
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const linkByPlatform = new Map(links.map((l) => [l.platform, l]));

  async function handleConnect(platform: SocialPlatform) {
    if (!url.trim()) {
      toast("Enter your profile URL", "error");
      return;
    }
    setBusy(true);
    try {
      await connect({
        platform,
        profileUrl: url.trim(),
        username: username.trim() || undefined,
        isPublic: true,
      });
      toast("Account linked", "success");
      setEditing(null);
      setUrl("");
      setUsername("");
    } catch {
      toast("Could not connect — check the URL", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect(platform: SocialPlatform) {
    setBusy(true);
    try {
      await disconnect(platform);
      toast("Disconnected", "success");
    } catch {
      toast("Disconnect failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading connected accounts…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted-foreground)]">
        Phase 10 demo: paste your public profile URL. OAuth coming soon — see docs/SOCIAL-OAUTH.md.
      </p>
      {SOCIAL_PLATFORMS.map(({ id, label, optional }) => {
        const connected = linkByPlatform.get(id);
        const isEditing = editing === id;

        return (
          <div
            key={id}
            className="rounded-xl border border-[var(--border)] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <SocialPlatformIcon platform={id} size="sm" />
                <div className="min-w-0">
                  <span className="text-sm font-medium">
                    {label}
                    {optional && (
                      <span className="ml-1 text-xs text-[var(--muted-foreground)]">(optional)</span>
                    )}
                  </span>
                  {connected && (
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {connected.username ? `@${connected.username}` : connected.profileUrl}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {connected && (
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={connected.isPublic}
                      onChange={(e) => void setPlatformPublic(id, e.target.checked)}
                      className="accent-[var(--accent)]"
                    />
                    Public
                  </label>
                )}
                {connected ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void handleDisconnect(id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(isEditing ? null : id);
                      setUrl("");
                      setUsername("");
                    }}
                  >
                    {isEditing ? "Cancel" : "Connect"}
                  </Button>
                )}
              </div>
            </div>
            {isEditing && !connected && (
              <div className={cn("mt-3 grid gap-2 border-t border-[var(--border)] pt-3")}>
                <div className="grid gap-1">
                  <Label htmlFor={`url-${id}`}>Profile URL</Label>
                  <Input
                    id={`url-${id}`}
                    type="url"
                    placeholder={`https://${label.toLowerCase().replace(/\s.*/, "")}.com/yourname`}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`user-${id}`}>Username (optional)</Label>
                  <Input
                    id={`user-${id}`}
                    placeholder="your_handle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <Button size="sm" disabled={busy} onClick={() => void handleConnect(id)}>
                  Save link
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

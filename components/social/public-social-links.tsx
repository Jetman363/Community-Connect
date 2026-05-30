"use client";

import { useEffect, useState } from "react";
import type { SocialLinkDto } from "@/types/social";
import { fetchPublicSocialLinks } from "@/lib/api/client";
import { SocialPlatformIcon } from "@/components/social/social-platform-icon";
import { SOCIAL_PLATFORMS } from "@/types/social";
import { ExternalLink } from "lucide-react";

export function PublicSocialLinks({ userId }: { userId: string }) {
  const [links, setLinks] = useState<SocialLinkDto[]>([]);

  useEffect(() => {
    fetchPublicSocialLinks(userId)
      .then((res) => setLinks(res.items))
      .catch(() => setLinks([]));
  }, [userId]);

  if (links.length === 0) return null;

  const labels = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p.label]));

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        Social
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--muted)]"
            title={labels[link.platform] ?? link.platform}
          >
            <SocialPlatformIcon platform={link.platform} size="sm" />
            <span>{link.username ? `@${link.username}` : labels[link.platform]}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          </a>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { SocialPlatform } from "@prisma/client";
import type { SocialLinkDto } from "@/types/social";
import {
  fetchMySocialLinks,
  connectSocialLink,
  disconnectSocialLink,
  patchSocialLinks,
} from "@/lib/api/client";

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMySocialLinks();
      setLinks(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(
    async (data: {
      platform: SocialPlatform;
      profileUrl: string;
      username?: string;
      isPublic?: boolean;
    }) => {
      const res = await connectSocialLink(data);
      setLinks((prev) => {
        const rest = prev.filter((l) => l.platform !== res.link.platform);
        return [...rest, res.link].sort((a, b) => a.platform.localeCompare(b.platform));
      });
      return res.link;
    },
    []
  );

  const disconnect = useCallback(async (platform: SocialPlatform) => {
    await disconnectSocialLink(platform);
    setLinks((prev) => prev.filter((l) => l.platform !== platform));
  }, []);

  const setAllPublic = useCallback(async (isPublic: boolean) => {
    const res = await patchSocialLinks({ isPublic });
    setLinks(res.items);
  }, []);

  const setPlatformPublic = useCallback(
    async (platform: SocialPlatform, isPublic: boolean) => {
      const res = await patchSocialLinks({ platforms: [{ platform, isPublic }] });
      setLinks(res.items);
    },
    []
  );

  return {
    links,
    loading,
    error,
    refresh,
    connect,
    disconnect,
    setAllPublic,
    setPlatformPublic,
  };
}

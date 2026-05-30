"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { PersonalizationProfileDto } from "@/types/engagement";
import { mockPoints } from "@/lib/mock-data/rewards";

export function usePersonalization() {
  const [profile, setProfile] = useState<PersonalizationProfileDto>({
    interests: ["events", "deals", "family"],
    preferences: {},
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PersonalizationProfileDto & { source?: string }>(
        "/api/personalization/profile"
      );
      setProfile({ interests: data.interests, preferences: data.preferences });
    } catch {
      setProfile({
        interests: ["events", "deals", "family"],
        preferences: { feedDensity: "normal" },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateInterests = useCallback(async (interests: string[]) => {
    try {
      await apiFetch("/api/personalization/profile", {
        method: "PATCH",
        body: JSON.stringify({ interests }),
      });
      setProfile((p) => ({ ...p, interests }));
    } catch {
      setProfile((p) => ({ ...p, interests }));
    }
  }, []);

  return { profile, loading, refresh, updateInterests };
}

export function useRewardsSummary() {
  const [points, setPoints] = useState(mockPoints);

  useEffect(() => {
    void apiFetch<typeof mockPoints>("/api/rewards/points")
      .then(setPoints)
      .catch(() => undefined);
  }, []);

  return points;
}

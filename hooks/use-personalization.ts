"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { PersonalizationProfileDto } from "@/types/engagement";
import type { ForYouRecommendation, UserPreferencesDto } from "@/types/radius";
import { sidebarNav, mobileNav, orderNavByHref, type NavItem } from "@/config/navigation";

export function usePersonalization() {
  const [profile, setProfile] = useState<PersonalizationProfileDto>({
    interests: ["events", "deals", "family"],
    preferences: {},
  });
  const [preferences, setPreferences] = useState<UserPreferencesDto | null>(null);
  const [recommendations, setRecommendations] = useState<ForYouRecommendation[]>([]);
  const [navigation, setNavigation] = useState<{ sidebar: NavItem[]; mobile: NavItem[] } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, prefs, recs, nav] = await Promise.all([
        apiFetch<PersonalizationProfileDto & { source?: string }>("/api/personalization/profile"),
        apiFetch<UserPreferencesDto>("/api/user/preferences").catch(() => null),
        apiFetch<{ items: ForYouRecommendation[] }>("/api/recommendations/for-you").catch(() => ({
          items: [],
        })),
        apiFetch<{ sidebarOrder: string[]; mobileOrder: string[] }>(
          "/api/personalization/navigation"
        ).catch(() => null),
      ]);
      setProfile({ interests: profileData.interests, preferences: profileData.preferences });
      if (prefs) setPreferences(prefs);
      setRecommendations(recs.items);
      if (nav) {
        setNavigation({
          sidebar: orderNavByHref(sidebarNav, nav.sidebarOrder),
          mobile: orderNavByHref(mobileNav, nav.mobileOrder),
        });
      }
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
      await apiFetch("/api/personalization/interests", {
        method: "POST",
        body: JSON.stringify({ interests }),
      });
      setProfile((p) => ({ ...p, interests }));
      void refresh();
    } catch {
      setProfile((p) => ({ ...p, interests }));
    }
  }, [refresh]);

  const updatePreferences = useCallback(async (data: Partial<UserPreferencesDto>) => {
    try {
      const updated = await apiFetch<UserPreferencesDto>("/api/user/preferences", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setPreferences(updated);
    } catch {
      setPreferences((p) => (p ? { ...p, ...data } : null));
    }
  }, []);

  return {
    profile,
    preferences,
    recommendations,
    navigation,
    loading,
    refresh,
    updateInterests,
    updatePreferences,
  };
}

export function useRewardsSummary() {
  const [points, setPoints] = useState({ balance: 0, level: 1, streak: 0, nextLevelAt: 100 });

  useEffect(() => {
    void apiFetch<typeof points>("/api/rewards/points")
      .then(setPoints)
      .catch(() => undefined);
  }, []);

  return points;
}

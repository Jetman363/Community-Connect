"use client";

import { useCallback, useEffect, useState } from "react";
import type { SafetyAlertDto } from "@/types/safety";
import { apiFetch } from "@/lib/api/client";
import { useSocket } from "@/hooks/use-socket";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

export function useAlerts(filters?: {
  category?: string;
  severity?: string;
  search?: string;
  history?: boolean;
}) {
  const [items, setItems] = useState<SafetyAlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("db");
  const { on } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters?.category && filters.category !== "all") qs.set("category", filters.category.toUpperCase());
      if (filters?.severity) qs.set("severity", filters.severity);
      if (filters?.search) qs.set("search", filters.search);
      if (filters?.history) qs.set("history", "true");
      const res = await apiFetch<{
        items: SafetyAlertDto[];
        source?: string;
      }>(`/api/alerts?${qs}`);
      setItems(res.items);
      setSource(res.source ?? "db");
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.severity, filters?.search, filters?.history]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubNew = on(SOCKET_EVENTS.ALERT_NEW, (data) => {
      const alert = data as SafetyAlertDto;
      setItems((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    });
    const unsubUpdate = on(SOCKET_EVENTS.ALERT_UPDATE, (data) => {
      const alert = data as SafetyAlertDto;
      setItems((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));
    });
    return () => {
      unsubNew?.();
      unsubUpdate?.();
    };
  }, [on]);

  const acknowledge = async (id: string) => {
    await apiFetch(`/api/alerts/${id}/acknowledge`, { method: "POST" });
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const bookmark = async (id: string, saved: boolean) => {
    await apiFetch(`/api/alerts/${id}/bookmark`, { method: saved ? "DELETE" : "POST" });
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, bookmarked: !saved } : a))
    );
  };

  return { items, loading, source, reload: load, acknowledge, bookmark };
}

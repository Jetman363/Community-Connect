"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiNotification } from "@/types/feed";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/client";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { useSocket } from "@/hooks/use-socket";

export function useNotifications() {
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications();
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = on(SOCKET_EVENTS.NOTIFICATION_NEW, (data) => {
      const n = data as ApiNotification;
      setItems((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    return () => unsub?.();
  }, [on]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return { items, unreadCount, loading, markRead, markAllRead, refresh: load };
}

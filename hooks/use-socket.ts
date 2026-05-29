"use client";

import { useEffect, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { AUTH_COOKIE } from "@/lib/auth";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function useSocket(communityId?: string) {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = getCookie(AUTH_COOKIE);
    if (!token) return;

    const s = io({
      path: "/api/socket",
      auth: { token, communityId },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    s.on("connect", () => {
      setConnected(true);
      if (communityId) s.emit("join:community", communityId);
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));

    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [communityId]);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      socket?.emit(event, data);
    },
    [socket]
  );

  const on = useCallback(
    (event: string, handler: (data: unknown) => void) => {
      socket?.on(event, handler);
      return () => {
        socket?.off(event, handler);
      };
    },
    [socket]
  );

  return { connected, emit, on, socket };
}

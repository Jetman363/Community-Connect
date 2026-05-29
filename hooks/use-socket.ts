"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    const s = url ? io(url, { path: "/api/socket" }) : io({ path: "/api/socket" });
    const id = requestAnimationFrame(() => setSocket(s));
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    return () => {
      cancelAnimationFrame(id);
      s.disconnect();
    };
  }, []);

  return { socket, connected };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./config";
import type { CadEvent } from "./types";

export function useCadWebSocket(token: string | null, onEvent?: (event: CadEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<CadEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const clearPing = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  }, []);

  const startPing = useCallback((ws: WebSocket) => {
    clearPing();
    pingRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);
  }, [clearPing]);

  const connect = useCallback(() => {
    if (!token) return;
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      setConnected(true);
      startPing(ws);
    };

    ws.onclose = () => {
      setConnected(false);
      clearPing();
      wsRef.current = null;
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as CadEvent;
        setLastEvent(event);
        onEventRef.current?.(event);
      } catch {
        /* ignore non-JSON */
      }
    };

    wsRef.current = ws;
  }, [token, startPing, clearPing]);

  useEffect(() => {
    connect();
    return () => {
      clearPing();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, clearPing]);

  return { connected, lastEvent };
}

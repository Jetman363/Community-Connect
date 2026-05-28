"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "@/lib/api-config";
import { fetchAlerts, mapBackendAlert, type BackendAlert, type LiveAlert } from "@/lib/alerts-api";
import { ALERTS as MOCK_ALERTS } from "@/lib/mock-data";
import type { Alert } from "@/types";

interface UseLiveAlertsOptions {
  token: string | null;
  agencyId?: string;
  enabled?: boolean;
}

function mockAsLive(): LiveAlert[] {
  const mockGeo: Record<string, { lat: number; lon: number }> = {
    a1: { lat: 39.7817, lon: -89.6501 },
    a2: { lat: 39.8021, lon: -89.6442 },
    a3: { lat: 39.799, lon: -89.648 },
  };
  const mockEnrichment: Record<string, Record<string, unknown>> = {
    a1: {
      linked_events: [{ type: "vehicle_bolo_match", related_event_ids: ["CAD-2026-04821"] }],
      patterns: ["armed_robbery_cluster"],
    },
    a2: {
      linked_events: [{ type: "officer_backup_request", related_event_ids: ["CAD-2026-04819"] }],
      patterns: ["officer_safety_escalation"],
    },
    a3: {
      patterns: ["gang_activity_forecast"],
      rule_hits: ["fusion_center_intel"],
    },
  };

  return MOCK_ALERTS.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    priority: a.priority,
    timestamp: a.timestamp,
    sourceSystem: a.type === "Intel" ? "fusion_osint" : "mock_cad",
    officerSafety: a.priority === "critical" || a.type === "Officer Safety",
    threatScore: a.priority === "critical" ? 95 : a.type === "Officer Safety" ? 82 : 55,
    threatLevel: a.priority,
    status: "active",
    escalated: a.priority === "critical",
    geolocation: mockGeo[a.id] ?? null,
    entities: [],
    correlationId: a.id === "a1" ? "corr-4821" : null,
    aiEnrichment: mockEnrichment[a.id] ?? {},
    normalizedPayload: {},
    raw: null as unknown as BackendAlert,
  }));
}

export function useLiveAlerts({ token, agencyId, enabled = true }: UseLiveAlertsOptions) {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!token || !enabled) {
      setAlerts(mockAsLive());
      setUsingMock(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts(token);
      setAlerts(data.length > 0 ? data : mockAsLive());
      setUsingMock(data.length === 0);
    } catch (err) {
      setAlerts(mockAsLive());
      setUsingMock(true);
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [token, enabled]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!token || !enabled) {
      setConnected(false);
      return;
    }

    const wsUrl = `${WS_BASE_URL}/v1/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as BackendAlert & { type?: string };
        if (payload.type === "heartbeat" || payload.type === "pong") return;
        if (agencyId && payload.agency_id && payload.agency_id !== agencyId) return;
        const mapped = mapBackendAlert(payload);
        setUsingMock(false);
        setAlerts((prev) => {
          const without = prev.filter((a) => a.id !== mapped.id);
          return [mapped, ...without].slice(0, 100);
        });
      } catch {
        // ignore malformed frames
      }
    };

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 25000);

    return () => {
      clearInterval(ping);
      ws.close();
      wsRef.current = null;
    };
  }, [token, agencyId, enabled]);

  const refresh = loadAlerts;

  return { alerts, connected, loading, error, usingMock, refresh };
}

export function toDisplayAlerts(alerts: LiveAlert[]): Alert[] {
  return alerts.map(({ id, type, message, priority, timestamp }) => ({
    id,
    type,
    message,
    priority,
    timestamp,
  }));
}

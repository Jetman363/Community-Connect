"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reportsApi } from "@/lib/reports-api";
import type { IncidentReportFormData } from "@/lib/report-types";

const AUTOSAVE_INTERVAL_MS = 30_000;

interface UseAutosaveReportOptions {
  reportId: string | null;
  token: string | null;
  data: IncidentReportFormData;
  enabled: boolean;
  onSaved?: (savedAt: Date) => void;
  onError?: (error: Error) => void;
}

export function useAutosaveReport({
  reportId,
  token,
  data,
  enabled,
  onSaved,
  onError,
}: UseAutosaveReportOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dataRef = useRef(data);
  const initialRef = useRef(true);

  dataRef.current = data;

  const save = useCallback(async () => {
    if (!reportId || !token || !enabled) return;
    setSaving(true);
    try {
      await reportsApi.autosave(token, reportId, dataRef.current);
      const now = new Date();
      setLastSaved(now);
      setDirty(false);
      onSaved?.(now);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Autosave failed"));
    } finally {
      setSaving(false);
    }
  }, [reportId, token, enabled, onSaved, onError]);

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    setDirty(true);
  }, [data]);

  useEffect(() => {
    if (!reportId || !token || !enabled) return;
    const timer = setInterval(() => {
      if (dirty) void save();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reportId, token, enabled, dirty, save]);

  return { save, saving, lastSaved, dirty, markClean: () => setDirty(false) };
}

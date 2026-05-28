"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import {
  isMultiScreen,
  queryScreens,
  requestScreenPermission,
  type ScreenInfo,
} from "@/lib/multi-screen";

let screensCache: ScreenInfo[] = [];
let screensListeners = new Set<() => void>();
let screensInitialized = false;

async function refreshScreens() {
  screensCache = await queryScreens();
  screensListeners.forEach((l) => l());
}

function subscribeScreens(listener: () => void) {
  screensListeners.add(listener);
  if (!screensInitialized && typeof window !== "undefined") {
    screensInitialized = true;
    void refreshScreens();
    window.addEventListener("resize", refreshScreens);
  }
  return () => {
    screensListeners.delete(listener);
  };
}

function getScreensSnapshot(): ScreenInfo[] {
  return screensCache;
}

export function useMultiScreen() {
  const screens = useSyncExternalStore(subscribeScreens, getScreensSnapshot, () => []);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    void refreshScreens();
  }, []);

  const requestPermission = useCallback(async () => {
    const ok = await requestScreenPermission();
    setPermissionGranted(ok);
    await refreshScreens();
    return ok;
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.getScreenDetails) return;
    let details: Awaited<ReturnType<NonNullable<typeof window.getScreenDetails>>> | null = null;
    let mounted = true;

    void window.getScreenDetails().then((d) => {
      if (!mounted) return;
      details = d;
      setPermissionGranted(true);
      const onChange = () => void refreshScreens();
      d.addEventListener("screenschange", onChange);
      void refreshScreens();
      return () => d.removeEventListener("screenschange", onChange);
    }).catch(() => {
      if (mounted) setPermissionGranted(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    screens,
    multiScreen: isMultiScreen(screens),
    permissionGranted,
    refresh,
    requestPermission,
  };
}

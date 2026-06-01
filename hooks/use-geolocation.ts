"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_LOCATION } from "@/config/interests";
import type { UserLocationDto } from "@/types/radius";

export interface GeolocationState {
  lat?: number;
  lng?: number;
  accuracy?: number;
  error?: string;
  loading: boolean;
  permission: "granted" | "denied" | "prompt" | "unknown";
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    permission: "unknown",
  });
  const [manual, setManual] = useState<Partial<UserLocationDto>>({});

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    void navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        setState((s) => ({
          ...s,
          permission: result.state as GeolocationState["permission"],
        }));
      })
      .catch(() => undefined);
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported", loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: undefined }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          loading: false,
          permission: "granted",
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          loading: false,
          permission: err.code === err.PERMISSION_DENIED ? "denied" : "prompt",
          error: err.message,
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const setManualLocation = useCallback((data: Partial<UserLocationDto>) => {
    setManual(data);
  }, []);

  const resolvedLocation = (): UserLocationDto => {
    if (state.lat != null && state.lng != null) {
      return {
        lat: state.lat,
        lng: state.lng,
        city: manual.city,
        state: manual.state,
        zip: manual.zip,
        country: manual.country ?? "US",
        precise: true,
        sharingEnabled: manual.sharingEnabled ?? true,
        source: "GPS",
      };
    }
    if (manual.city || manual.zip) {
      return {
        lat: manual.lat ?? DEMO_LOCATION.lat,
        lng: manual.lng ?? DEMO_LOCATION.lng,
        city: manual.city,
        state: manual.state,
        zip: manual.zip,
        country: manual.country ?? "US",
        precise: false,
        sharingEnabled: manual.sharingEnabled ?? true,
        source: "MANUAL",
      };
    }
    return {
      ...DEMO_LOCATION,
      precise: false,
      sharingEnabled: true,
      source: "MANUAL",
    };
  };

  return {
    ...state,
    manual,
    setManualLocation,
    requestLocation,
    resolvedLocation,
  };
}

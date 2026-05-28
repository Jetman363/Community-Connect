"use client";

import { useSyncExternalStore } from "react";
import {
  getPopoutSnapshot,
  isPanelPoppedOut,
  subscribePopouts,
} from "@/lib/panel-popout-store";

export function usePanelPopouts(workspace: string) {
  const entries = useSyncExternalStore(subscribePopouts, getPopoutSnapshot, () => []);

  const poppedIds = entries.filter((e) => e.workspace === workspace).map((e) => e.panelId);

  return {
    poppedIds,
    isPoppedOut: (panelId: string) => isPanelPoppedOut(workspace, panelId),
  };
}

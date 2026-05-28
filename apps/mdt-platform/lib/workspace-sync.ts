"use client";

const CHANNEL_NAME = "cad-workspace-sync";
const STORAGE_PREFIX = "cad-workspace-selection-";

type SelectionMessage = {
  type: "selection";
  workspace: string;
  incidentId: string | null;
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function publishIncidentSelection(workspace: string, incidentId: string | null) {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${workspace}`;
  if (incidentId) localStorage.setItem(key, incidentId);
  else localStorage.removeItem(key);
  getChannel()?.postMessage({ type: "selection", workspace, incidentId } satisfies SelectionMessage);
}

export function readIncidentSelection(workspace: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${STORAGE_PREFIX}${workspace}`);
}

export function subscribeIncidentSelection(
  workspace: string,
  onChange: (incidentId: string | null) => void,
): () => void {
  const handler = (ev: MessageEvent<SelectionMessage>) => {
    if (ev.data?.type === "selection" && ev.data.workspace === workspace) {
      onChange(ev.data.incidentId);
    }
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === `${STORAGE_PREFIX}${workspace}`) {
      onChange(e.newValue);
    }
  };
  getChannel()?.addEventListener("message", handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    getChannel()?.removeEventListener("message", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

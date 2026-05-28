"use client";

import { openWindowOnScreen, pickSecondaryScreen, queryScreens, type ScreenInfo } from "@/lib/multi-screen";

const STORAGE_KEY = "cad-panel-popouts";
const CHANNEL_NAME = "cad-panel-popout";

export interface PopoutEntry {
  workspace: string;
  panelId: string;
  title: string;
  openedAt: number;
}

type PopoutMessage =
  | { type: "register"; entry: PopoutEntry }
  | { type: "unregister"; workspace: string; panelId: string }
  | { type: "sync"; entries: PopoutEntry[] };

let cache: PopoutEntry[] = [];
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function readStorage(): PopoutEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PopoutEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(entries: PopoutEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  cache = entries;
  listeners.forEach((l) => l());
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (ev: MessageEvent<PopoutMessage>) => {
      const msg = ev.data;
      if (msg.type === "sync") {
        writeStorage(msg.entries);
      } else if (msg.type === "register") {
        const next = cache.filter(
          (e) => !(e.workspace === msg.entry.workspace && e.panelId === msg.entry.panelId),
        );
        next.push(msg.entry);
        writeStorage(next);
      } else if (msg.type === "unregister") {
        writeStorage(
          cache.filter((e) => !(e.workspace === msg.workspace && e.panelId === msg.panelId)),
        );
      }
    };
  }
  return channel;
}

function broadcastSync() {
  getChannel()?.postMessage({ type: "sync", entries: cache } satisfies PopoutMessage);
}

export function initPopoutStore() {
  cache = readStorage();
  getChannel();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) cache = readStorage();
      listeners.forEach((l) => l());
    });
  }
}

export function subscribePopouts(listener: () => void): () => void {
  initPopoutStore();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPopoutSnapshot(): PopoutEntry[] {
  initPopoutStore();
  return cache;
}

export function getWorkspacePopouts(workspace: string): PopoutEntry[] {
  return getPopoutSnapshot().filter((e) => e.workspace === workspace);
}

export function isPanelPoppedOut(workspace: string, panelId: string): boolean {
  return getPopoutSnapshot().some((e) => e.workspace === workspace && e.panelId === panelId);
}

export function registerPopout(entry: PopoutEntry) {
  initPopoutStore();
  const next = cache.filter(
    (e) => !(e.workspace === entry.workspace && e.panelId === entry.panelId),
  );
  next.push(entry);
  writeStorage(next);
  getChannel()?.postMessage({ type: "register", entry } satisfies PopoutMessage);
  broadcastSync();
}

export function unregisterPopout(workspace: string, panelId: string) {
  initPopoutStore();
  writeStorage(cache.filter((e) => !(e.workspace === workspace && e.panelId === panelId)));
  getChannel()?.postMessage({ type: "unregister", workspace, panelId } satisfies PopoutMessage);
  broadcastSync();
}

export function popoutWindowName(workspace: string, panelId: string): string {
  return `cad-popout-${workspace}-${panelId}`;
}

export function buildPopoutUrl(basePath: string, workspace: string, panelId: string): string {
  const params = new URLSearchParams({ workspace, panel: panelId });
  return `${basePath}?${params.toString()}`;
}

export async function openPanelPopout(opts: {
  workspace: string;
  panelId: string;
  title: string;
  basePath: string;
  screen?: ScreenInfo | null;
}): Promise<Window | null> {
  const screens = await queryScreens();
  const target = opts.screen ?? pickSecondaryScreen(screens) ?? screens[0];
  if (!target) return null;

  const url = buildPopoutUrl(opts.basePath, opts.workspace, opts.panelId);
  const name = popoutWindowName(opts.workspace, opts.panelId);
  const win = openWindowOnScreen(url, target, name);
  if (win) {
    registerPopout({
      workspace: opts.workspace,
      panelId: opts.panelId,
      title: opts.title,
      openedAt: Date.now(),
    });
  }
  return win;
}

export function dockPanelPopout(workspace: string, panelId: string) {
  const name = popoutWindowName(workspace, panelId);
  unregisterPopout(workspace, panelId);
  try {
    const existing = window.open("", name);
    existing?.close();
  } catch {
    /* ignore */
  }
}

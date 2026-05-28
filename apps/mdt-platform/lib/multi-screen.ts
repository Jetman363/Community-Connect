/** Browser screen info normalized for window placement */
export interface ScreenInfo {
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
  label: string;
}

type ScreenDetailsLike = {
  screens: Array<{
    left: number;
    top: number;
    width: number;
    height: number;
    isPrimary: boolean;
    label?: string;
  }>;
  addEventListener: (type: "screenschange", listener: () => void) => void;
  removeEventListener: (type: "screenschange", listener: () => void) => void;
};

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetailsLike>;
  }
}

function normalizeScreens(details: ScreenDetailsLike): ScreenInfo[] {
  return details.screens.map((s, i) => ({
    left: s.left,
    top: s.top,
    width: s.width,
    height: s.height,
    isPrimary: s.isPrimary,
    label: s.label ?? (s.isPrimary ? "Primary display" : `Display ${i + 1}`),
  }));
}

/** Fallback when Screen Details API is unavailable */
function fallbackScreens(): ScreenInfo[] {
  const s = window.screen as Screen & {
    availLeft?: number;
    availTop?: number;
    left?: number;
    isExtended?: boolean;
  };
  const primary: ScreenInfo = {
    left: s.availLeft ?? 0,
    top: s.availTop ?? 0,
    width: s.availWidth,
    height: s.availHeight,
    isPrimary: true,
    label: "Primary display",
  };

  const extended = s.isExtended === true;

  if (!extended) return [primary];

  const secondaryLeft = (s.left ?? 0) + s.width;
  return [
    primary,
    {
      left: secondaryLeft,
      top: s.availTop ?? 0,
      width: s.availWidth,
      height: s.availHeight,
      isPrimary: false,
      label: "Secondary display",
    },
  ];
}

export async function queryScreens(): Promise<ScreenInfo[]> {
  if (typeof window === "undefined") return [];
  try {
    if (window.getScreenDetails) {
      const details = await window.getScreenDetails();
      const screens = normalizeScreens(details);
      return screens.length > 0 ? screens : fallbackScreens();
    }
  } catch {
    /* permission denied or unsupported */
  }
  return fallbackScreens();
}

export function isMultiScreen(screens: ScreenInfo[]): boolean {
  return screens.length >= 2;
}

export function pickSecondaryScreen(screens: ScreenInfo[]): ScreenInfo | null {
  if (screens.length < 2) return null;
  return screens.find((s) => !s.isPrimary) ?? screens[1] ?? null;
}

export function openWindowOnScreen(
  url: string,
  screen: ScreenInfo,
  name: string,
  opts?: { widthRatio?: number; heightRatio?: number },
): Window | null {
  const widthRatio = opts?.widthRatio ?? 0.92;
  const heightRatio = opts?.heightRatio ?? 0.92;
  const width = Math.round(screen.width * widthRatio);
  const height = Math.round(screen.height * heightRatio);
  const left = Math.round(screen.left + (screen.width - width) / 2);
  const top = Math.round(screen.top + (screen.height - height) / 2);
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
  return window.open(url, name, features);
}

export async function requestScreenPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !window.getScreenDetails) return false;
  try {
    await window.getScreenDetails();
    return true;
  } catch {
    return false;
  }
}

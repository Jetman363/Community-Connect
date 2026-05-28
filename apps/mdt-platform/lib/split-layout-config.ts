/** Panels opened on a secondary monitor when using split layout */
export const SPLIT_SECONDARY_PANELS: Record<string, string[]> = {
  "layout-dispatch-console": ["map"],
  "layout-mdt-workspace": ["map"],
  "layout-calltaker-page": ["timeline"],
};

export function getSecondaryPanelsForWorkspace(storageKey: string): string[] {
  return SPLIT_SECONDARY_PANELS[storageKey] ?? [];
}

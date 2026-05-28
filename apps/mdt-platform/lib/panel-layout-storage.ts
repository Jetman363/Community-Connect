export interface StoredPanelLayout {
  order: string[];
  /** Width share 0–1 per panel id; should sum to ~1 */
  widths: Record<string, number>;
}

export function loadPanelLayout(storageKey: string, panelIds: string[], defaultWeights: Record<string, number>): StoredPanelLayout {
  if (typeof window === "undefined") {
    return normalizeLayout(panelIds, defaultWeights);
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return normalizeLayout(panelIds, defaultWeights);
    const parsed = JSON.parse(raw) as StoredPanelLayout;
    const order = parsed.order.filter((id) => panelIds.includes(id));
    for (const id of panelIds) {
      if (!order.includes(id)) order.push(id);
    }
    const widths: Record<string, number> = {};
    for (const id of panelIds) {
      widths[id] = typeof parsed.widths[id] === "number" ? parsed.widths[id] : (defaultWeights[id] ?? 1);
    }
    return normalizeLayout(order, widths);
  } catch {
    return normalizeLayout(panelIds, defaultWeights);
  }
}

export function savePanelLayout(storageKey: string, layout: StoredPanelLayout): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(layout));
}

export function normalizeLayout(order: string[], weights: Record<string, number>): StoredPanelLayout {
  const sum = order.reduce((acc, id) => acc + (weights[id] ?? 1), 0) || 1;
  const widths: Record<string, number> = {};
  for (const id of order) {
    widths[id] = (weights[id] ?? 1) / sum;
  }
  return { order, widths };
}

export function resetPanelLayout(storageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}

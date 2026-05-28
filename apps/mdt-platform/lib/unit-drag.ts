import type { DragEvent } from "react";

/** MIME type for dispatcher unit → incident drag-and-drop */
export const UNIT_DRAG_MIME = "application/x-cad-unit-id";

export function setUnitDragData(dataTransfer: DataTransfer, unitId: string, callSign?: string) {
  dataTransfer.setData(UNIT_DRAG_MIME, unitId);
  dataTransfer.setData("text/plain", callSign ?? unitId);
  dataTransfer.effectAllowed = "copy";
}

export function getUnitDragId(dataTransfer: DataTransfer): string | null {
  const id = dataTransfer.getData(UNIT_DRAG_MIME);
  return id || null;
}

export function unitDropHandlers(onAssign: (unitId: string) => void) {
  return {
    onDragOver: (e: DragEvent) => {
      if (e.dataTransfer.types.includes(UNIT_DRAG_MIME)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const unitId = getUnitDragId(e.dataTransfer);
      if (unitId) onAssign(unitId);
    },
  };
}

"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) startY.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    async (e: React.TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? 0;
      if (endY - startY.current > 80 && window.scrollY === 0) {
        setPulling(true);
        try {
          await onRefresh();
        } finally {
          setPulling(false);
        }
      }
    },
    [onRefresh]
  );

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={(e) => void handleTouchEnd(e)}>
      {pulling && (
        <div className="flex justify-center py-2 text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
}

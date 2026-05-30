"use client";

import { useEffect, useState } from "react";
import { cn, formatRelative } from "@/lib/utils";

type RelativeTimeProps = {
  date: Date | string;
  className?: string;
};

/** Client-only relative label; avoids SSR/hydration drift from Date.now(). */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [label, setLabel] = useState<string | null>(null);
  const dateTime = typeof date === "string" ? date : date.toISOString();

  useEffect(() => {
    const update = () => setLabel(formatRelative(date));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [date]);

  return (
    <time dateTime={dateTime} className={cn(className)} suppressHydrationWarning>
      {label ?? "\u00a0"}
    </time>
  );
}

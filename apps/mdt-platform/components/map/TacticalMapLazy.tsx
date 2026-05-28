import dynamic from "next/dynamic";
import type { TacticalMapProps } from "./TacticalMap";

export const TacticalMapLazy = dynamic(
  () => import("./TacticalMap").then((m) => m.TacticalMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-slate-900/60 border border-slate-700 rounded text-slate-500 text-sm min-h-[120px]">
        Loading map…
      </div>
    ),
  }
);

export type { TacticalMapProps };

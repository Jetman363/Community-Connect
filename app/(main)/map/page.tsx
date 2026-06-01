import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContent } from "./map-content";

export default function MapPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[55vh] min-h-[280px] rounded-2xl" />}>
      <MapContent />
    </Suspense>
  );
}

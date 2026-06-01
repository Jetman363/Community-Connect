import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceContent } from "./marketplace-content";

export default function MarketplacePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
      <MarketplaceContent />
    </Suspense>
  );
}

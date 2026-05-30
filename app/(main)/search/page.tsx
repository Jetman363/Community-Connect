import { Suspense } from "react";
import { SearchContent } from "./search-content";
import SearchLoading from "./loading";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}

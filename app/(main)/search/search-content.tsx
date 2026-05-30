"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips } from "@/components/ui/filter-chips";
import { apiFetch } from "@/lib/api/client";
interface UnifiedSearchItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  href: string;
  imageUrl?: string;
  meta?: string;
}
import { Search, Sparkles } from "lucide-react";

const TABS = [
  { id: "all", label: "All" },
  { id: "marketplace", label: "Marketplace" },
  { id: "events", label: "Events" },
  { id: "businesses", label: "Businesses" },
  { id: "groups", label: "Groups" },
  { id: "news", label: "News" },
  { id: "alerts", label: "Alerts" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface AiSearchResponse {
  query: string;
  parsedIntent?: string;
  tabs: Record<string, UnifiedSearchItem[]>;
  source?: string;
}

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [tab, setTab] = useState<TabId>("all");
  const [loading, setLoading] = useState(false);
  const [nlMode, setNlMode] = useState(true);
  const [data, setData] = useState<AiSearchResponse | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setData(null);
      return;
    }
    async function run() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: debounced });
        if (tab !== "all") params.set("tab", tab);
        const res = await apiFetch<AiSearchResponse>(`/api/search/ai?${params}`);
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [debounced, tab]);

  const items = data?.tabs?.[tab] ?? data?.tabs?.all ?? [];

  return (
    <PageTransition>
      <PageHeader
        title="Smart Search"
        description="Natural language search across marketplace, events, groups, news, and alerts"
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder='Try "garage sales this weekend" or "safety alerts today"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setNlMode(!nlMode)}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
            nlMode ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)]"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          AI natural language {nlMode ? "on" : "off"}
        </button>
        {data?.parsedIntent && nlMode && (
          <span className="text-xs text-[var(--muted-foreground)]">
            Intent: {data.parsedIntent}
          </span>
        )}
      </div>

      <FilterChips
        options={[...TABS]}
        value={tab}
        onChange={(v) => setTab(v as TabId)}
        className="mb-6"
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : debounced.trim().length < 2 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Type at least 2 characters to search your community.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No results in this tab.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <Link
                href={item.href}
                className="glass-panel flex gap-3 rounded-xl border border-[var(--border)] p-4 transition-colors hover:bg-[var(--muted)]/40"
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium line-clamp-1">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.meta && (
                    <p className="mt-1 text-xs text-[var(--accent)]">{item.meta}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data?.source && debounced.length >= 2 && (
        <p className="mt-4 text-xs text-[var(--muted-foreground)]">Source: {data.source}</p>
      )}
    </PageTransition>
  );
}

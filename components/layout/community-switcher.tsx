"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import {
  Dropdown,
  DropdownItem,
  DropdownChevron,
} from "@/components/ui/dropdown";

interface CommunityOption {
  id: string;
  name: string;
  slug: string;
  memberRole?: string;
}

export function CommunitySwitcher() {
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<{ items: CommunityOption[] }>("/api/communities");
        setCommunities(res.items);
        if (res.items[0] && !activeId) setActiveId(res.items[0].id);
      } catch {
        setCommunities([
          { id: "demo-community", name: "Oak Hills Community", slug: "demo-community" },
        ]);
        setActiveId("demo-community");
      }
    })();
  }, [activeId]);

  const active = communities.find((c) => c.id === activeId) ?? communities[0];

  const switchCommunity = async (id: string) => {
    setActiveId(id);
    try {
      await apiFetch("/api/communities/switch", {
        method: "POST",
        body: JSON.stringify({ communityId: id }),
      });
      window.location.reload();
    } catch {
      /* cookie may not persist in demo */
    }
  };

  if (!active) return null;

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]">
          <Building2 className="h-4 w-4 text-[var(--accent)]" />
          <span className="max-w-[140px] truncate font-medium">{active.name}</span>
          <DropdownChevron />
        </div>
      }
      align="start"
      className="shrink-0"
    >
      {communities.map((c) => (
        <DropdownItem key={c.id} onClick={() => switchCommunity(c.id)}>
          <span className={c.id === active.id ? "font-semibold text-[var(--accent)]" : ""}>
            {c.name}
          </span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

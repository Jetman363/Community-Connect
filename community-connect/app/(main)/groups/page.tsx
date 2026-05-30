"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { GroupCard } from "@/components/groups/group-card";
import { FilterChips } from "@/components/ui/filter-chips";
import { apiFetch } from "@/lib/api/client";
import { mockGroups } from "@/lib/mock-data/groups";
import type { GroupDto } from "@/types/engagement";

const categories = [
  { id: "all", label: "All" },
  { id: "Fitness", label: "Fitness" },
  { id: "Family", label: "Family" },
  { id: "Food & Drink", label: "Food" },
  { id: "Outdoors", label: "Outdoors" },
  { id: "Social", label: "Social" },
];

export default function GroupsPage() {
  const [filter, setFilter] = useState("all");
  const [groups, setGroups] = useState<GroupDto[]>(mockGroups);

  useEffect(() => {
    const qs = filter !== "all" ? `?category=${encodeURIComponent(filter)}` : "";
    void apiFetch<{ items: GroupDto[] }>(`/api/groups${qs}`)
      .then((d) => setGroups(d.items))
      .catch(() => setGroups(mockGroups));
  }, [filter]);

  return (
    <PageTransition>
      <PageHeader title="Groups" description="Find your people — join interest-based communities" />
      <FilterChips options={categories} value={filter} onChange={setFilter} className="mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </PageTransition>
  );
}

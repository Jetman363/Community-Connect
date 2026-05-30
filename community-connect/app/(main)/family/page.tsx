"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FamilyActivityCard } from "@/components/family/family-activity-card";
import { FilterChips } from "@/components/ui/filter-chips";
import { mockFamilyActivities, familyFilters } from "@/lib/mock-data/family";

export default function FamilyPage() {
  const [filter, setFilter] = useState("all");
  const activities =
    filter === "all"
      ? mockFamilyActivities
      : mockFamilyActivities.filter((a) => a.category === filter);

  return (
    <PageTransition>
      <PageHeader
        title="Family Hub"
        description="School calendars, sports, camps, and kid-friendly activities"
      />
      <FilterChips options={[...familyFilters]} value={filter} onChange={setFilter} className="mb-6" />
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
        {activities.map((activity) => (
          <FamilyActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </PageTransition>
  );
}

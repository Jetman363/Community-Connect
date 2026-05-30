"use client";

import Link from "next/link";
import { FilterChips } from "@/components/ui/filter-chips";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { jobTypes } from "@/hooks/use-jobs";
import type { JobListingDto } from "@/types/marketplace";
import { Briefcase } from "lucide-react";

function JobCard({ job, onSelect }: { job: JobListingDto; onSelect: () => void }) {
  return (
    <article
      onClick={onSelect}
      className="cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="accent">{job.jobType.replace("_", " ")}</Badge>
        {job.remote && <Badge>Remote</Badge>}
      </div>
      <h3 className="mt-2 font-semibold">{job.title}</h3>
      {job.description && (
        <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{job.description}</p>
      )}
      <p className="mt-2 text-sm font-medium">
        {job.salaryMin != null
          ? `$${job.salaryMin}${job.salaryMax ? `–$${job.salaryMax}` : ""}${job.salaryUnit ? `/${job.salaryUnit}` : ""}`
          : "Compensation TBD"}
      </p>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        {job.location ?? "Local"} · {job.poster.displayName}
      </p>
    </article>
  );
}

export function JobsSection({
  jobs,
  loading,
  jobType,
  onJobTypeChange,
  onSelect,
  compact,
}: {
  jobs: JobListingDto[];
  loading?: boolean;
  jobType: string;
  onJobTypeChange: (id: string) => void;
  onSelect: (j: JobListingDto) => void;
  compact?: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5 text-[var(--accent)]" />
          Job Opportunities
        </h2>
        {!compact && (
          <Link href="/marketplace?tab=jobs" className="text-sm text-[var(--accent)] hover:underline">
            View all →
          </Link>
        )}
      </div>
      <FilterChips
        options={jobTypes.map((j) => ({ id: j.id, label: j.label }))}
        value={jobType}
        onChange={onJobTypeChange}
        className="mb-4"
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(compact ? jobs.slice(0, 4) : jobs).map((job) => (
            <JobCard key={job.id} job={job} onSelect={() => onSelect(job)} />
          ))}
        </div>
      )}
      {jobs.length === 0 && !loading && (
        <p className="py-8 text-center text-[var(--muted-foreground)]">No jobs posted yet</p>
      )}
    </section>
  );
}

export { JobCard };

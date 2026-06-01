"use client";

import { useCallback, useEffect, useState } from "react";
import type { JobListingDto } from "@/types/marketplace";
import { fetchJobs, applyToJob } from "@/lib/api/client";

export const jobTypes = [
  { id: "all", label: "All" },
  { id: "FULL_TIME", label: "Full-time" },
  { id: "PART_TIME", label: "Part-time" },
  { id: "CONTRACT", label: "Contract" },
  { id: "GIG", label: "Gig" },
  { id: "VOLUNTEER", label: "Volunteer" },
] as const;

export function useJobs(options: { jobType?: string; search?: string } = {}) {
  const [jobs, setJobs] = useState<JobListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("db");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJobs({
        jobType: options.jobType,
        search: options.search,
      });
      setJobs(res.items);
      setSource(res.source ?? "db");
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [options.jobType, options.search]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = useCallback(async (jobId: string, message: string) => {
    await applyToJob(jobId, message);
  }, []);

  return { jobs, loading, source, apply, refresh: load };
}

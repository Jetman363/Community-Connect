import type { JobStatus, JobType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";
import type { JobListingDto } from "@/types/marketplace";

type JobRow = Prisma.JobListingGetPayload<{
  include: { poster: { include: { profile: true } } };
}>;

const include = { poster: { include: { profile: true } } } as const;

export function mapJob(row: JobRow, extras?: { favorited?: boolean }): JobListingDto {
  return {
    id: row.id,
    communityId: row.communityId,
    title: row.title,
    description: row.description,
    jobType: row.jobType,
    status: row.status,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryUnit: row.salaryUnit,
    skills: row.skills,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    remote: row.remote,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    poster: {
      id: row.poster.id,
      displayName: row.poster.profile?.displayName ?? "Neighbor",
      avatarUrl: row.poster.profile?.avatarUrl,
    },
    favorited: extras?.favorited,
  };
}

export async function listJobs(input: {
  communityId: string;
  jobType?: JobType;
  status?: JobStatus;
  search?: string;
  cursor?: string;
  limit?: number;
  userId?: string;
}) {
  const limit = input.limit ?? 20;
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;

  const items = await prisma.jobListing.findMany({
    where: {
      communityId: input.communityId,
      status: input.status ?? "ACTIVE",
      ...(input.jobType ? { jobType: input.jobType } : {}),
      ...(input.search
        ? {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(decoded
        ? {
            OR: [
              { createdAt: { lt: new Date(decoded.t) } },
              { createdAt: new Date(decoded.t), id: { lt: decoded.id } },
            ],
          }
        : {}),
    },
    include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const last = page[page.length - 1];

  let favoritedIds = new Set<string>();
  if (input.userId && page.length) {
    const favs = await prisma.favorite.findMany({
      where: {
        userId: input.userId,
        targetType: "JOB",
        targetId: { in: page.map((p) => p.id) },
      },
    });
    favoritedIds = new Set(favs.map((f) => f.targetId));
  }

  return {
    items: page.map((r) => mapJob(r, { favorited: favoritedIds.has(r.id) })),
    nextCursor: hasMore && last ? encodeCursor(last.id, last.createdAt) : null,
    hasMore,
  };
}

export async function getJob(id: string, userId?: string) {
  const row = await prisma.jobListing.findUnique({ where: { id }, include });
  if (!row) return null;
  let favorited = false;
  if (userId) {
    const f = await prisma.favorite.findUnique({
      where: { userId_targetType_targetId: { userId, targetType: "JOB", targetId: id } },
    });
    favorited = !!f;
  }
  return mapJob(row, { favorited });
}

export async function createJob(data: Prisma.JobListingUncheckedCreateInput) {
  const row = await prisma.jobListing.create({ data, include });
  return mapJob(row);
}

export async function updateJob(
  id: string,
  data: Prisma.JobListingUpdateInput,
  posterId?: string
) {
  const existing = await prisma.jobListing.findUnique({ where: { id } });
  if (!existing) return null;
  if (posterId && existing.posterId !== posterId) return null;
  const row = await prisma.jobListing.update({ where: { id }, data, include });
  return mapJob(row);
}

export async function deleteJob(id: string, posterId?: string) {
  const existing = await prisma.jobListing.findUnique({ where: { id } });
  if (!existing) return false;
  if (posterId && existing.posterId !== posterId) return false;
  await prisma.jobListing.update({ where: { id }, data: { status: "CLOSED" } });
  return true;
}

import type { FavoriteTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FavoriteDto } from "@/types/marketplace";

export function mapFavorite(row: {
  id: string;
  targetType: FavoriteTargetType;
  targetId: string;
  label: string | null;
  createdAt: Date;
}): FavoriteDto {
  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listFavorites(userId: string, targetType?: FavoriteTargetType) {
  const rows = await prisma.favorite.findMany({
    where: { userId, ...(targetType ? { targetType } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(mapFavorite);
}

export async function addFavorite(
  userId: string,
  targetType: FavoriteTargetType,
  targetId: string,
  label?: string
) {
  const row = await prisma.favorite.upsert({
    where: {
      userId_targetType_targetId: { userId, targetType, targetId },
    },
    create: { userId, targetType, targetId, label },
    update: { label },
  });
  return mapFavorite(row);
}

export async function removeFavorite(
  userId: string,
  targetType: FavoriteTargetType,
  targetId: string
) {
  await prisma.favorite.deleteMany({
    where: { userId, targetType, targetId },
  });
  return true;
}

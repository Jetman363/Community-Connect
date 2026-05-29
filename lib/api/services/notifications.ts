import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApiNotification } from "@/types/feed";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";

function mapNotification(n: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: Date;
}): ApiNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function listNotifications(userId: string, cursor?: string, limit = 20) {
  const decoded = cursor ? decodeCursor(cursor) : null;
  const items = await prisma.notification.findMany({
    where: {
      userId,
      ...(decoded ? { createdAt: { lt: new Date(decoded.t) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const last = page[page.length - 1];

  return {
    items: page.map(mapNotification),
    nextCursor: hasMore && last ? encodeCursor(last.id, last.createdAt) : null,
    hasMore,
    unreadCount: await prisma.notification.count({ where: { userId, read: false } }),
  };
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      link: input.link,
    },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export { mapNotification };

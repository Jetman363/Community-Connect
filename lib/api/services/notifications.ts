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

export async function notifyNearbyAlert(input: {
  userId: string;
  alertTitle: string;
  alertId: string;
  severity: string;
}) {
  return createNotification({
    userId: input.userId,
    type: "ALERT",
    title: severityLabel(input.severity) + " alert nearby",
    body: input.alertTitle,
    link: `/alerts?id=${input.alertId}`,
  });
}

export async function notifyGeofenceAlert(input: {
  userId: string;
  zoneName: string;
  alertTitle: string;
  alertId: string;
}) {
  return createNotification({
    userId: input.userId,
    type: "ALERT",
    title: `Alert in ${input.zoneName}`,
    body: input.alertTitle,
    link: `/alerts?id=${input.alertId}`,
  });
}

export async function notifyEmergencyAlert(input: {
  userId: string;
  alertTitle: string;
  alertId: string;
}) {
  return createNotification({
    userId: input.userId,
    type: "ALERT",
    title: "Emergency alert",
    body: input.alertTitle,
    link: `/alerts?id=${input.alertId}`,
  });
}

export async function notifyReportStatus(input: {
  userId: string;
  reportId: string;
  status: string;
  title: string;
}) {
  return createNotification({
    userId: input.userId,
    type: "REPORT",
    title: `Report ${statusLabel(input.status)}`,
    body: input.title,
    link: `/report?id=${input.reportId}`,
  });
}

function severityLabel(s: string): string {
  if (s === "CRITICAL" || s === "HIGH") return "Urgent";
  if (s === "MODERATE") return "Safety";
  return "Info";
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    UNDER_REVIEW: "under review",
    IN_PROGRESS: "in progress",
    RESOLVED: "resolved",
    CLOSED: "closed",
  };
  return map[s] ?? s.toLowerCase();
}

export { mapNotification };

import "server-only";
import { prisma } from "@/lib/prisma";
import {
  emitToCommunity,
  emitToGeofence,
  emitToUser,
  emitToRooms,
  SOCKET_EVENTS,
} from "./emit";
import { findGeofenceRoomsForPoint } from "@/lib/api/services/geofences";
import {
  notifyEmergencyAlert,
  notifyGeofenceAlert,
  notifyNearbyAlert,
} from "@/lib/api/services/notifications";
import { withinRadiusM } from "@/lib/geo/distance";
import type { SafetyAlertDto } from "@/types/safety";
import { mapAlert } from "@/lib/api/services/alerts";

export async function broadcastNewAlert(alert: {
  id: string;
  communityId: string;
  title: string;
  severity: string;
  lat: number | null;
  lng: number | null;
}) {
  const full = await prisma.safetyAlert.findUnique({
    where: { id: alert.id },
    include: { _count: { select: { acknowledgments: true } } },
  });
  if (!full) return;
  const dto = mapAlert(full);

  emitToCommunity(alert.communityId, SOCKET_EVENTS.ALERT_NEW, dto);
  emitToCommunity(alert.communityId, SOCKET_EVENTS.MAP_MARKER_UPDATE, {
    action: "add",
    marker: { id: alert.id, type: "alert", title: alert.title, lat: alert.lat, lng: alert.lng },
  });

  if (alert.lat != null && alert.lng != null) {
    const geofenceRooms = await findGeofenceRoomsForPoint(
      alert.communityId,
      alert.lat,
      alert.lng
    );
    emitToRooms(geofenceRooms, SOCKET_EVENTS.ALERT_NEW, dto);

    await notifySubscribers(alert.communityId, alert.id, alert.title, alert.severity, alert.lat, alert.lng, geofenceRooms);
  }
}

async function notifySubscribers(
  communityId: string,
  alertId: string,
  title: string,
  severity: string,
  lat: number,
  lng: number,
  geofenceRooms: string[]
) {
  const subs = await prisma.alertSubscription.findMany({
    where: { OR: [{ zone: { communityId } }, { zoneId: null }] },
    include: { zone: true },
    take: 500,
  });

  const zoneIds = new Set(
    geofenceRooms.map((r) => r.replace("geofence:", ""))
  );

  for (const sub of subs) {
    if (severity === "INFO" && !sub.notifyInfo) continue;
    if ((severity === "MODERATE" || severity === "LOW") && !sub.notifyModerate) continue;
    if ((severity === "HIGH" || severity === "CRITICAL") && !sub.notifyEmergency) continue;

    let shouldNotify = false;
    if (sub.zoneId && zoneIds.has(sub.zoneId)) {
      shouldNotify = true;
    } else if (
      sub.centerLat != null &&
      sub.centerLng != null &&
      sub.radiusM &&
      withinRadiusM(lat, lng, sub.centerLat, sub.centerLng, sub.radiusM)
    ) {
      shouldNotify = true;
    }

    if (!shouldNotify) continue;

    if (severity === "CRITICAL" || severity === "HIGH") {
      await notifyEmergencyAlert({ userId: sub.userId, alertTitle: title, alertId });
    } else if (sub.zone?.name) {
      await notifyGeofenceAlert({
        userId: sub.userId,
        zoneName: sub.zone.name,
        alertTitle: title,
        alertId,
      });
    } else {
      await notifyNearbyAlert({
        userId: sub.userId,
        alertTitle: title,
        alertId,
        severity,
      });
    }

    const n = await prisma.notification.findFirst({
      where: { userId: sub.userId },
      orderBy: { createdAt: "desc" },
    });
    if (n) emitToUser(sub.userId, SOCKET_EVENTS.NOTIFICATION_NEW, n);
  }
}

export function broadcastAlertUpdate(dto: SafetyAlertDto, communityId: string) {
  emitToCommunity(communityId, SOCKET_EVENTS.ALERT_UPDATE, dto);
  emitToCommunity(communityId, SOCKET_EVENTS.MAP_MARKER_UPDATE, {
    action: "update",
    marker: { id: dto.id, type: "alert", title: dto.title, lat: dto.lat, lng: dto.lng },
  });
}

export function broadcastReportNew(report: unknown, communityId: string) {
  emitToCommunity(communityId, SOCKET_EVENTS.REPORT_NEW, report);
  emitToCommunity(communityId, SOCKET_EVENTS.MAP_MARKER_UPDATE, { action: "add", marker: report });
}

export function broadcastReportStatus(report: unknown, communityId: string, reporterId: string) {
  emitToCommunity(communityId, SOCKET_EVENTS.REPORT_STATUS, report);
  emitToUser(reporterId, SOCKET_EVENTS.REPORT_STATUS, report);
}

import "server-only";
import type { Server } from "socket.io";
import { SOCKET_EVENTS } from "./events";

export { SOCKET_EVENTS };

let io: Server | null = null;

export function setIO(server: Server): void {
  io = server;
}

export function getIO(): Server | null {
  return io;
}

export function emitToCommunity(communityId: string, event: string, payload: unknown) {
  io?.to(`community:${communityId}`).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToGeofence(geofenceId: string, event: string, payload: unknown) {
  io?.to(`geofence:${geofenceId}`).emit(event, payload);
}

export function emitToRooms(rooms: string[], event: string, payload: unknown) {
  for (const room of rooms) {
    io?.to(room).emit(event, payload);
  }
}

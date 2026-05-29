import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL || "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on("join:community", (communityId: string) => {
      socket.join(`community:${communityId}`);
    });

    socket.on("alert:subscribe", () => {
      socket.join("alerts");
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitAlert(alert: unknown): void {
  io?.to("alerts").emit("alert:new", alert);
}

export function emitCommunityUpdate(communityId: string, payload: unknown): void {
  io?.to(`community:${communityId}`).emit("community:update", payload);
}

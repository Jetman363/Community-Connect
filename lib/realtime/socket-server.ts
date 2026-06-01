import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "@/lib/auth";
import { setIO } from "./emit";

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", credentials: true },
  });

  setIO(io);

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.replace("Bearer ", "") as string | undefined);

    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      next(new Error("Invalid token"));
      return;
    }

    socket.data.userId = payload.sub;
    socket.data.communityId = socket.handshake.auth?.communityId as string | undefined;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const communityId = socket.data.communityId as string | undefined;

    socket.join(`user:${userId}`);
    if (communityId) socket.join(`community:${communityId}`);

    socket.on("join:community", (id: string) => {
      if (typeof id === "string") socket.join(`community:${id}`);
    });
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[socket] Realtime server active at /api/socket");
  }

  return io;
}

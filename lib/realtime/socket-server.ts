import type { Server as HttpServer } from "http";

/**
 * Realtime socket server stub — Phase 2.
 * Run via `npm run dev:socket` when implementing WebSocket features.
 */
export function createSocketServerStub(_httpServer?: HttpServer): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[socket] Realtime server stub — implement in Phase 2");
  }
}

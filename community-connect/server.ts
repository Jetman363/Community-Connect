/**
 * Custom dev server with Socket.io — run via `npm run dev:socket`
 * Production: use separate socket service or Vercel-compatible polling fallback.
 */
import { createServer } from "http";
import next from "next";
import { initSocketServer } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Community Connect ready on http://${hostname}:${port}`);
    console.log(`> Socket.io at path /api/socket`);
  });
});

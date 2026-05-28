#!/usr/bin/env bash
# Run full connected demo — backend, orchestrator, MDT frontend
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/deployments/docker/docker-compose.yml"

echo "==> Starting backend + demo orchestrator..."
docker compose -f "$COMPOSE" up -d postgres redis cad-dispatch-service call-parser-service websocket-gateway demo-orchestrator 2>/dev/null || \
  docker compose -f "$COMPOSE" up -d

echo "==> Waiting for services..."
for url in http://localhost:8070/v1/health http://localhost:8090/healthz http://localhost:8061/healthz; do
  for i in $(seq 1 20); do
    curl -sf "$url" >/dev/null 2>&1 && break
    sleep 2
  done
done

echo "==> Rebuilding websocket-gateway (demo channels)..."
docker compose -f "$COMPOSE" build websocket-gateway >/dev/null 2>&1 || true
docker compose -f "$COMPOSE" up -d websocket-gateway

cd "$ROOT/apps/mdt-platform"
export NEXT_PUBLIC_DEMO_MODE=true
export NEXT_PUBLIC_AGENCY_ID=agency-demo-001

echo ""
echo "============================================"
echo "  BlueCore Connected Demo Mode"
echo "  http://localhost:3001"
echo ""
echo "  Open 4 tabs with different roles:"
echo "    /calltaker  — 911 Operator"
echo "    /dispatch   — CAD Dispatcher"
echo "    /supervisor — Supervisor Command"
echo "    /mdt        — Officer MDT"
echo ""
echo "  Start a scenario from /supervisor"
echo "============================================"
echo ""
exec npm run dev

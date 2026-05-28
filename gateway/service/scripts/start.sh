#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
eval "$(/opt/homebrew/bin/brew shellenv zsh 2>/dev/null || true)"
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/expat/lib:${DYLD_LIBRARY_PATH:-}"
export PYTHONPATH="${ROOT}/shared/python:${ROOT}/gateway/service"
# Local dev: gateway runs on host, not inside Docker network
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://127.0.0.1:8001}"
export ALERT_ENGINE_URL="${ALERT_ENGINE_URL:-http://127.0.0.1:8060}"
export INTEGRATION_SERVICE_URL="${INTEGRATION_SERVICE_URL:-http://127.0.0.1:8050}"
export RMS_SERVICE_URL="${RMS_SERVICE_URL:-http://127.0.0.1:8010}"
export WEBSOCKET_GATEWAY_URL="${WEBSOCKET_GATEWAY_URL:-http://127.0.0.1:8061}"
cd "${ROOT}/gateway/service"
if [[ ! -d .venv ]]; then
  /opt/homebrew/opt/python@3.12/bin/python3.12 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

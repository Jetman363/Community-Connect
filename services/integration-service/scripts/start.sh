#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
eval "$(/opt/homebrew/bin/brew shellenv zsh 2>/dev/null || true)"
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/expat/lib:${DYLD_LIBRARY_PATH:-}"
export PYTHONPATH="${ROOT}/shared/python:${ROOT}/services/integration-service"
cd "${ROOT}/services/integration-service"
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
eval "$(/opt/homebrew/bin/brew shellenv zsh 2>/dev/null || true)"
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/expat/lib:${DYLD_LIBRARY_PATH:-}"
export PYTHONPATH="${ROOT}/shared/python:${ROOT}/services/rms-service"
cd "${ROOT}/services/rms-service"
if [[ ! -d .venv ]]; then
  /opt/homebrew/opt/python@3.12/bin/python3.12 -m venv .venv
fi
.venv/bin/pip install -q -r requirements.txt
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload

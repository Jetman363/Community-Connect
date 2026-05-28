#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${1:-public-safety-ai}"
VISIBILITY="${2:-public}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Installing GitHub CLI..."
  brew install gh
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Sign in to GitHub (browser or token):"
  gh auth login --git-protocol https --web
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin already set — pushing main..."
  git push -u origin main
else
  echo "Creating GitHub repo: $REPO_NAME ($VISIBILITY)"
  gh repo create "$REPO_NAME" \
    --"$VISIBILITY" \
    --source=. \
    --remote=origin \
    --description "BlueCore public safety platform — MDT, dispatch, 911 intake, and microservices" \
    --push
fi

echo ""
echo "Done. Repository URL:"
gh repo view --json url -q .url

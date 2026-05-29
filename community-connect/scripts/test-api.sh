#!/usr/bin/env bash
# Phase 3 API smoke tests — requires running server and valid session cookie
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
COOKIE="${CC_COOKIE:-}"

if [ -z "$COOKIE" ]; then
  echo "Login first and set CC_COOKIE=cc_token=..."
  echo "Example: CC_COOKIE=\"\$(curl -s -c - $BASE/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"resident@communityconnect.app\",\"password\":\"Demo1234!\"}' | awk '/cc_token/ {print \$7}')\""
  exit 1
fi

auth() { curl -s -b "$COOKIE" "$@"; }

echo "== GET /api/posts =="
auth "$BASE/api/posts?sort=latest&limit=5" | head -c 500
echo -e "\n"

echo "== GET /api/notifications =="
auth "$BASE/api/notifications" | head -c 400
echo -e "\n"

echo "== GET /api/search?q=cleanup =="
auth "$BASE/api/search?q=cleanup" | head -c 400
echo -e "\n"

echo "== POST /api/posts (create) =="
auth -X POST "$BASE/api/posts" -H "Content-Type: application/json" \
  -d '{"content":"API test post from test-api.sh","category":"GENERAL"}' | head -c 400
echo -e "\n"

echo "Done."

#!/usr/bin/env bash
# Phase 8 smoke test — health, auth, key routes
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@communityconnect.app}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo1234!}"

pass=0
fail=0

check() {
  local name="$1"
  local code="$2"
  local expect="${3:-200}"
  if [ "$code" = "$expect" ]; then
    echo "✓ $name ($code)"
    pass=$((pass + 1))
  else
    echo "✗ $name (expected $expect, got $code)"
    fail=$((fail + 1))
  fi
}

echo "== Smoke test: $BASE =="

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
check "GET /api/health" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/login")
check "GET /login" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/posts")
check "GET /api/posts (unauth)" "$code" "401"

# Login and capture cookie
COOKIE=$(curl -s -c - "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" \
  | awk '/cc_token/ {print $7}')

if [ -n "$COOKIE" ]; then
  echo "✓ POST /api/auth/login (cookie received)"
  pass=$((pass + 1))
  code=$(curl -s -o /dev/null -w "%{http_code}" -b "cc_token=$COOKIE" "$BASE/api/posts?limit=1")
  check "GET /api/posts (auth)" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -b "cc_token=$COOKIE" "$BASE/api/search/discover?q=test")
  check "GET /api/search/discover" "$code"
else
  echo "✗ POST /api/auth/login (no cookie — DB may be unavailable)"
  fail=$((fail + 1))
fi

echo ""
echo "Results: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1

#!/usr/bin/env bash
# Seed test users for BlueCore (admin + officer) — writes to auth DB via gateway.
set -euo pipefail

API="${API_URL:-http://localhost:8000}"
AGENCY_ID="${AGENCY_ID:-00000000-0000-4000-8000-000000000001}"

register() {
  local username=$1 password=$2 role=$3 first=$4 last=$5 rank=$6
  local response http_code
  response=$(curl -sS -w "\n%{http_code}" -X POST "$API/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"agency_id\": \"$AGENCY_ID\",
      \"username\": \"$username\",
      \"password\": \"$password\",
      \"first_name\": \"$first\",
      \"last_name\": \"$last\",
      \"role\": \"$role\",
      \"rank\": \"$rank\"
    }" 2>/dev/null)
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "200" ]]; then
    echo "  CREATED $username"
  elif echo "$body" | grep -qiE 'exist|duplicate|unique'; then
    echo "  EXISTS  $username (already in database)"
  else
    echo "  ERROR   $username (HTTP $http_code): $body"
  fi
}

echo "Seeding test users via $API ..."
register "admin@sapd.gov" "AdminPass1234!" "admin" "System" "Admin" "Captain"
register "demo.officer" "DemoPass1234!" "admin" "Sarah" "Mitchell" "Detective"

echo ""
echo "Test logins (http://localhost:3000/login):"
echo "  Admin:   admin@sapd.gov / AdminPass1234!"
echo "  Officer: demo.officer / DemoPass1234!"
echo ""
echo "Agency ID: $AGENCY_ID"

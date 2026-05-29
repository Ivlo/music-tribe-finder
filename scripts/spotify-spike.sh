#!/usr/bin/env bash
#
# Spotify API spike — Sprint 0 blocking step.
#
# Goal: empirically verify what a NEW client_credentials app can actually reach,
# since Spotify (Nov 2024) restricted /recommendations, /audio-features, and
# often returns preview_url = null for new/dev-mode apps. The result decides the
# compiler/composer architecture (live audio-feature targeting vs. curated pools).
#
# Dependency-free: uses curl + jq only. Reads creds from .env.local.
#
# Usage:  bash scripts/spotify-spike.sh
#
set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ .env.local not found at $ENV_FILE"
  echo "  Create it with:"
  echo "    SPOTIFY_CLIENT_ID=your_id"
  echo "    SPOTIFY_CLIENT_SECRET=your_secret"
  exit 1
fi

# Pull only the two keys we need; tolerate quotes/whitespace, ignore other lines.
SPOTIFY_CLIENT_ID="$(grep -E '^SPOTIFY_CLIENT_ID=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r\n' | xargs)"
SPOTIFY_CLIENT_SECRET="$(grep -E '^SPOTIFY_CLIENT_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r\n' | xargs)"

if [[ -z "$SPOTIFY_CLIENT_ID" || -z "$SPOTIFY_CLIENT_SECRET" ]]; then
  echo "✗ SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing or empty in .env.local"
  exit 1
fi

bar() { printf '%s\n' "────────────────────────────────────────────────────────"; }

# ── 1. Token via client_credentials ────────────────────────────────────────
bar; echo "1) client_credentials token grant"; bar
TOKEN_JSON="$(curl -s -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -u "${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}")"

TOKEN="$(echo "$TOKEN_JSON" | jq -r '.access_token // empty')"
if [[ -z "$TOKEN" ]]; then
  echo "✗ Token request failed:"
  echo "$TOKEN_JSON" | jq .
  exit 1
fi
echo "✓ Got token (expires_in=$(echo "$TOKEN_JSON" | jq -r '.expires_in')s)"

AUTH=(-H "Authorization: Bearer ${TOKEN}")

# Helper: hit an endpoint, print HTTP status + a short verdict.
probe() {
  local name="$1" url="$2"
  bar; echo "$name"; bar
  echo "GET $url"
  local resp status body
  resp="$(curl -s -w $'\n%{http_code}' "${AUTH[@]}" "$url")"
  status="${resp##*$'\n'}"
  body="${resp%$'\n'*}"
  echo "HTTP $status"
  echo "$body" | jq -C . 2>/dev/null | head -40 || echo "$body" | head -20
  echo "$status"  # last line = status for callers that capture it
}

# ── 2. /search (baseline — should work) + preview_url census ────────────────
bar; echo "2) /v1/search  — baseline + preview_url census"; bar
SEARCH_URL="https://api.spotify.com/v1/search?q=genre:electronic&type=track&limit=50&market=US"
echo "GET $SEARCH_URL"
SEARCH_RESP="$(curl -s -w $'\n%{http_code}' "${AUTH[@]}" "$SEARCH_URL")"
SEARCH_STATUS="${SEARCH_RESP##*$'\n'}"
SEARCH_BODY="${SEARCH_RESP%$'\n'*}"
echo "HTTP $SEARCH_STATUS"
if [[ "$SEARCH_STATUS" == "200" ]]; then
  TOTAL="$(echo "$SEARCH_BODY" | jq '.tracks.items | length')"
  WITH_PREVIEW="$(echo "$SEARCH_BODY" | jq '[.tracks.items[] | select(.preview_url != null)] | length')"
  echo "✓ search OK — $TOTAL tracks returned"
  echo "  preview_url populated: $WITH_PREVIEW / $TOTAL"
  FIRST_ID="$(echo "$SEARCH_BODY" | jq -r '.tracks.items[0].id // empty')"
  SOME_IDS="$(echo "$SEARCH_BODY" | jq -r '[.tracks.items[].id] | join(",")')"
else
  echo "✗ search failed:"; echo "$SEARCH_BODY" | jq . 2>/dev/null | head -20
  FIRST_ID=""; SOME_IDS=""
fi

# ── 3. /recommendations (restricted Nov 2024?) ──────────────────────────────
REC_STATUS="$(probe "3) /v1/recommendations  — restricted for new apps?" \
  "https://api.spotify.com/v1/recommendations?limit=10&seed_genres=electronic&target_energy=0.8" \
  | tail -1)"

# ── 4. /audio-features (restricted Nov 2024?) ───────────────────────────────
if [[ -n "$SOME_IDS" ]]; then
  AF_STATUS="$(probe "4) /v1/audio-features  — restricted for new apps?" \
    "https://api.spotify.com/v1/audio-features?ids=${SOME_IDS}" | tail -1)"
else
  bar; echo "4) /v1/audio-features — SKIPPED (no track ids from search)"; bar
  AF_STATUS="skip"
fi

# ── 5. /recommendations/available-genre-seeds ───────────────────────────────
GS_STATUS="$(probe "5) /v1/recommendations/available-genre-seeds" \
  "https://api.spotify.com/v1/recommendations/available-genre-seeds" | tail -1)"

# ── Verdict ─────────────────────────────────────────────────────────────────
bar; echo "VERDICT"; bar
verdict() { # name status
  case "$2" in
    200) echo "  ✓ $1 — WORKS" ;;
    skip) echo "  – $1 — skipped" ;;
    *)   echo "  ✗ $1 — BLOCKED/failed (HTTP $2)" ;;
  esac
}
verdict "/search"                "$SEARCH_STATUS"
verdict "/recommendations"       "$REC_STATUS"
verdict "/audio-features"        "$AF_STATUS"
verdict "/available-genre-seeds" "$GS_STATUS"
echo
echo "Decision rule:"
echo "  recommendations + audio-features WORK → original plan (live feature targeting)"
echo "  either BLOCKED                        → contingency (curated pools / precomputed features)"

#!/usr/bin/env bash
#
# Head-to-head: iTunes Search vs Deezer for "electronic" and "chill" pools.
# Compares preview/artwork coverage, artist diversity, genre coherence, and a
# readable sample — to pick the track source for the contingency data strategy.
# Dependency-free: curl + jq, no auth.
#
set -uo pipefail

line(){ printf '%s\n' "──────────────────────────────────────────────────────────────"; }

# ── iTunes harvest + report ─────────────────────────────────────────────────
itunes() {
  local term="$1"
  local json
  json="$(curl -s "https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=50")"
  echo "$json" | jq -r --arg term "$term" '
    .results as $r |
    "  count           : \($r|length)",
    "  with_preview    : \([$r[]|select(.previewUrl//""!="")]|length)/\($r|length)",
    "  with_artwork    : \([$r[]|select(.artworkUrl100//""!="")]|length)/\($r|length)",
    "  unique_artists  : \([$r[].artistName]|unique|length)",
    "  genre_distrib   : \([$r[].primaryGenreName]|group_by(.)|map({g:.[0],n:length})|sort_by(-.n)|map("\(.g)×\(.n)")|join(", "))",
    "  sample:",
    ([$r[0:12][] | "    • \(.artistName) — \(.trackName)  [\(.primaryGenreName)]"]|join("\n"))
  '
}

# ── Deezer harvest + report (search) ────────────────────────────────────────
deezer_search() {
  local q="$1"
  local json
  json="$(curl -s "https://api.deezer.com/search?q=${q}&limit=50")"
  echo "$json" | jq -r '
    .data as $d |
    "  total_matches   : \(.total)",
    "  returned        : \($d|length)",
    "  with_preview    : \([$d[]|select(.preview//""!="")]|length)/\($d|length)",
    "  with_artwork    : \([$d[]|select(.album.cover_medium//""!="")]|length)/\($d|length)",
    "  unique_artists  : \([$d[].artist.name]|unique|length)",
    "  sample:",
    ([$d[0:12][] | "    • \(.artist.name) — \(.title)"]|join("\n"))
  '
}

# ── Deezer harvest via genre chart (the real pool mechanism) ─────────────────
deezer_chart() {
  local gid="$1" gname="$2"
  local json
  json="$(curl -s "https://api.deezer.com/chart/${gid}/tracks?limit=50")"
  echo "$json" | jq -r '
    .data as $d |
    "  returned        : \($d|length)",
    "  with_preview    : \([$d[]|select(.preview//""!="")]|length)/\($d|length)",
    "  unique_artists  : \([$d[].artist.name]|unique|length)",
    "  sample:",
    ([$d[0:12][] | "    • \(.artist.name) — \(.title)"]|join("\n"))
  '
}

echo; line; echo "ELECTRONIC"; line
echo "[iTunes] term=electronic"
itunes "electronic"
echo
echo "[Deezer] search q=electronic"
deezer_search "electronic"
echo
echo "[Deezer] genre chart: Electro (id 106)  ← genre-targeted pool"
deezer_chart 106 "Electro"

echo; line; echo "CHILL"; line
echo "[iTunes] term=chill"
itunes "chill"
echo
echo "[Deezer] search q=chill"
deezer_search "chill"

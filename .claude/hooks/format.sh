#!/usr/bin/env bash
# PostToolUse(Edit|Write): auto-format the edited .ts/.tsx file with Prettier.
#
# Non-blocking by design — always exits 0. The matcher only filters by tool
# name, so we filter by extension here. Formatting failures must never
# interrupt the session.
set -u
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$dir/lib-node-env.sh"

file="$(jq -r '.tool_input.file_path // empty')"
case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

ensure_node
if [ -x ./node_modules/.bin/prettier ]; then
  ./node_modules/.bin/prettier --write "$file" >/dev/null 2>&1
fi
exit 0

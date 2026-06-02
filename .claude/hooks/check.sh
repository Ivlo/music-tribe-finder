#!/usr/bin/env bash
# Stop: fast-feedback gate. Run lint + typecheck when Claude finishes a turn.
#
# Scope:
#   - lint: only the .ts/.tsx files touched since the last commit — tracked
#     changes (added/modified/renamed, not deleted) PLUS untracked-but-not-
#     ignored files. New files matter: `git diff HEAD` alone misses them.
#   - typecheck: always whole-project — a one-file edit can break types
#     anywhere, so tsc cannot be reliably scoped per file.
#
# On failure: block the stop (exit 2) and write the errors to stderr, which
# Claude Code feeds back to the model so it fixes them before ending the turn.
# Tests are intentionally excluded here (slower; covered by the pre-commit gate
# and CI).
#
# Loop guard: when stop_hook_active is true we are already in a forced
# continuation, so exit 0 and let Claude stop. (Claude Code also caps at 8
# consecutive blocks as a backstop.)
#
# Targets bash 3.2 (macOS default): no mapfile, no associative arrays.
set -u
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$dir/lib-node-env.sh"

input="$(cat)"
if [ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ]; then
  exit 0
fi

ensure_node

# Collect changed + new .ts/.tsx files (deduped), tolerating bash 3.2.
changed=()
while IFS= read -r f; do
  [ -n "$f" ] && changed+=("$f")
done < <(
  {
    git diff --name-only --diff-filter=ACMR HEAD -- '*.ts' '*.tsx'
    git ls-files --others --exclude-standard -- '*.ts' '*.tsx'
  } 2>/dev/null | sort -u
)

lint_rc=0
lint_out=""
if [ ${#changed[@]} -gt 0 ]; then
  lint_out="$(./node_modules/.bin/eslint "${changed[@]}" 2>&1)"
  lint_rc=$?
fi

type_out="$(./node_modules/.bin/tsc --noEmit 2>&1)"
type_rc=$?

if [ $lint_rc -ne 0 ] || [ $type_rc -ne 0 ]; then
  {
    echo "Stop hook blocked: the repo is not green. Fix these before ending the turn."
    if [ $lint_rc -ne 0 ]; then
      echo
      echo "=== eslint (failed) — checked: ${changed[*]} ==="
      echo "$lint_out"
    fi
    if [ $type_rc -ne 0 ]; then
      echo
      echo "=== tsc --noEmit (failed) ==="
      echo "$type_out"
    fi
  } >&2
  exit 2
fi
exit 0

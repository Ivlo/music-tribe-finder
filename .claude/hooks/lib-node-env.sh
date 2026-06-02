# shellcheck shell=bash
# Shared by Claude Code hooks: put the project's Node (via nvm) on PATH.
#
# Why: hooks run in a non-interactive shell that does not source the user's
# profile, so `node`/`pnpm` (installed through nvm) may be absent from PATH.
# The .bin shims (prettier, eslint, tsc) are `#!/usr/bin/env node` scripts and
# fail without node. We respect .nvmrc rather than hardcoding a version.
ensure_node() {
  command -v node >/dev/null 2>&1 && return 0
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1
  nvm use >/dev/null 2>&1 || true
}

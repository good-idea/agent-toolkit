#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "${SCRIPT_DIR}/wt-common.sh"

# ── Args ──────────────────────────────────────────────────────────────────────

# pnpm forwards its argument separator to shell scripts; accept it consistently.
if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: pnpm wt:init -- <task-number> [wt:start options]" >&2
  exit 1
fi

TASK_ARG="$1"
shift

TASK_ID=$(resolve_task_id "$TASK_ARG")

# ── Init ──────────────────────────────────────────────────────────────────────

echo "Task: $TASK_ID"
${SCRIPT_DIR}/wt-create.sh "$TASK_ARG"
${SCRIPT_DIR}/wt-start.sh "$TASK_ARG" "$@"

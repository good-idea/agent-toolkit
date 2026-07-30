#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/wt-common.sh"

# ── Args ──────────────────────────────────────────────────────────────────────
#
# wt:wrap is expected to run from WITHIN a worktree directory. It reads the task
# number from the worktree's .worktree-info file rather than taking it as an
# argument.

ALLOW_INCOMPLETE=false

# pnpm forwards its argument separator to shell scripts; accept it consistently.
if [[ "${1:-}" == "--" ]]; then
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-incomplete)
      ALLOW_INCOMPLETE=true
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: pnpm wt:wrap -- [--allow-incomplete]" >&2
      exit 1
      ;;
  esac
done

# ── Locate worktree metadata ──────────────────────────────────────────────────

if [[ ! -f ".worktree-info" ]]; then
  echo "Error: .worktree-info not found in the current directory." >&2
  echo "Run wt:wrap from inside a worktree created with wt:create." >&2
  exit 1
fi

# shellcheck disable=SC1091
source ".worktree-info"

if [[ -z "${TASK_NUMBER:-}" ]]; then
  echo "Error: TASK_NUMBER is not set in .worktree-info." >&2
  exit 1
fi

TASK_ID=$(resolve_task_id "$TASK_NUMBER")

# ── Resolve task ──────────────────────────────────────────────────────────────

TASK_FILE=$(find_task_file "$TASK_ID")

SLUG=$(get_field "$TASK_FILE" slug)
BRANCH=$(git branch --show-current)

echo "Task:     ${TASK_ID}-${SLUG}"
echo "Branch:   ${BRANCH}"
echo "Worktree: $(pwd)"
echo "Target:   ${BASE_BRANCH}"
echo "Require completed: $([[ "$ALLOW_INCOMPLETE" == true ]] && echo "no" || echo "yes")"
echo ""

# ── Confirm task status ───────────────────────────────────────────────────────

TASK_DOC_FILE="docs/tasks/${TASK_ID}-${SLUG}/TASK.md"
TASK_STATUS=$(get_field "$TASK_DOC_FILE" status)

echo "Task file: ${TASK_DOC_FILE}"
echo "Task status: ${TASK_STATUS}"

if [[ "$ALLOW_INCOMPLETE" == true ]]; then
  echo "Skipping completed-status check (--allow-incomplete)."
elif [[ "$TASK_STATUS" != "completed" ]]; then
  echo "Error: Task ${TASK_ID} is not marked completed in ${TASK_DOC_FILE}." >&2
  exit 1
else
  echo "Confirmed task ${TASK_ID} is marked completed."
fi

# ── Check for uncommitted changes ─────────────────────────────────────────────

echo ""
echo "Checking for uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: Worktree has uncommitted changes." >&2
  echo "Commit or stash them before running wt:wrap." >&2
  exit 1
fi
echo "✓ Worktree is clean."

# ── Fetch latest remote state ─────────────────────────────────────────────────

echo ""
echo "Fetching latest remote state..."
git fetch origin "${BASE_BRANCH}"

# ── Preflight: check mergeability ─────────────────────────────────────────────

echo ""
echo "Checking mergeability of ${BRANCH} into origin/${BASE_BRANCH}..."

MERGE_RESULT=$(git merge-tree --write-tree "origin/${BASE_BRANCH}" "$BRANCH" 2>&1) || {
  echo ""
  echo "Error: Branch ${BRANCH} cannot be cleanly merged into ${BASE_BRANCH}." >&2
  echo "" >&2
  echo "Conflict details:" >&2
  echo "$MERGE_RESULT" >&2
  echo "" >&2
  echo "Resolve conflicts on this branch before running wt:wrap again." >&2
  exit 1
}

echo "✓ Merge preflight passed — no conflicts with ${BASE_BRANCH}."

# ── Preflight: type-check, lint, tests ────────────────────────────────────────

run_check() {
  local label="$1"
  shift
  echo ""
  echo "Running ${label}..."
  if ! "$@"; then
    echo "" >&2
    echo "Error: ${label} failed. Fix the issues before wrapping." >&2
    exit 1
  fi
  echo "✓ ${label} passed."
}

run_check "type-check" pnpm type-check
run_check "lint" pnpm lint
run_check "tests" pnpm test

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "✓ Task ${TASK_ID} preflight checks passed."
echo ""
echo "Branch ${BRANCH} is clean, mergeable with ${BASE_BRANCH}, and all checks pass."
echo "Next: push the branch and open a PR (see the task skill for instructions)."

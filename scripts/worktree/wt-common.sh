#!/usr/bin/env bash
# Shared helpers for wt:* scripts. Source this file; do not execute directly.

# All worktree branches and pull requests target the canonical main branch.
readonly BASE_BRANCH="main"

# Resolve to 3-digit zero-padded task ID.
# Forces base-10 so leading-zero inputs (e.g. 007) are not treated as octal.
resolve_task_id() {
  printf '%03d' "$((10#$1))"
}

# Find the TASK.md for a given zero-padded ID (e.g. "006")
find_task_file() {
  local task_id="$1"
  local files
  files=(docs/tasks/${task_id}-*/TASK.md)
  if [[ ! -f "${files[0]}" ]]; then
    echo "Error: No task found with ID ${task_id}" >&2
    return 1
  fi
  echo "${files[0]}"
}

# Read a frontmatter field value from a TASK.md file.
# Strips surrounding single or double quotes; returns the raw value for null/unquoted.
get_field() {
  local file="$1"
  local field="$2"
  grep "^${field}:" "$file" \
    | head -1 \
    | sed "s/^${field}:[[:space:]]*//" \
    | sed "s/^[[:space:]]*['\"]//;s/['\"][[:space:]]*$//"
}

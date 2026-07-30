#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./wt-common.sh
source "${SCRIPT_DIR}/wt-common.sh"

# ── Args ──────────────────────────────────────────────────────────────────────

# pnpm forwards its argument separator to shell scripts; accept it consistently.
if [[ "${1:-}" == "--" ]]; then
  shift
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: pnpm wt:create -- <task-number>" >&2
  exit 1
fi

TASK_ID=$(resolve_task_id "$1")

# ── Resolve task ──────────────────────────────────────────────────────────────

echo "Task: $TASK_ID"
TASK_FILE=$(find_task_file "$TASK_ID")

SLUG=$(get_field "$TASK_FILE" slug)
TYPE=$(get_field "$TASK_FILE" type)
BRANCH="${TYPE}/${TASK_ID}-${SLUG}"
WORKTREE="worktrees/${TASK_ID}-${SLUG}"

echo "Task:     ${TASK_ID}-${SLUG}"
echo "Branch:   ${BRANCH}"
echo "Worktree: ${WORKTREE}"
echo ""

# ── Guard against existing worktree ──────────────────────────────────────────

if [[ -d "$WORKTREE" ]]; then
  echo "Error: Worktree already exists at ${WORKTREE}" >&2
  exit 1
fi

# ── Update task frontmatter & commit ─────────────────────────────────────────

pnpm task:update -- "$TASK_ID" --status=in-progress
pnpm exec prettier --write "$TASK_FILE" --log-level silent
git add "$TASK_FILE"

if git diff --cached --quiet -- "$TASK_FILE"; then
  echo "No docs changes to commit for task ${TASK_ID}."
else
  git commit -m "docs: updated status for task ${TASK_ID}"
fi

# ── Create worktree & branch ──────────────────────────────────────────────────

git worktree add -b "$BRANCH" "$WORKTREE" "$BASE_BRANCH"

# ── Write per-package env files ──────────────────────────────────────────────
# PORT_OFFSET = the numeric task ID (e.g. task 006 → offset 6), ensuring each
# worktree uses a unique port so multiple can run simultaneously.
# Add a block here for each package that needs its own .env.

PORT_OFFSET=$((10#$TASK_ID))
PORT=$((3000 + PORT_OFFSET))

# Writes key=value into an env file, replacing existing key if present.
set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  mkdir -p "$(dirname "$file")"
  touch "$file"

  if grep -q "^${key}=" "$file"; then
    local temporary_file
    temporary_file=$(mktemp "${file}.XXXXXX")
    sed "s#^${key}=.*#${key}=${value}#" "$file" > "$temporary_file"
    mv "$temporary_file" "$file"
  else
    [[ -s "$file" ]] && [[ $(tail -c1 "$file" | wc -l) -eq 0 ]] && echo >> "$file"
    echo "${key}=${value}" >> "$file"
  fi
}

# Copies src to dest. Falls back to src's sibling .env.example if src is absent.
copy_env_if_present() {
  local src="$1"
  local dest="$2"
  local src_dir; src_dir="$(dirname "$src")"
  local fallback="${src_dir}/.env.example"

  mkdir -p "$(dirname "$dest")"

  if [[ -f "$src" ]]; then
    cp "$src" "$dest"
    echo "Copied ${src} → ${dest}"
  elif [[ -f "$fallback" ]]; then
    cp "$fallback" "$dest"
    echo "Copied ${fallback} → ${dest} (from example)"
  else
    touch "$dest"
  fi
}

# web/.env — PORT is read natively by 'serve'
WEB_ENV_FILE="${WORKTREE}/web/.env"
copy_env_if_present "web/.env" "$WEB_ENV_FILE"
set_env_value "$WEB_ENV_FILE" "PORT_OFFSET" "$PORT_OFFSET"
set_env_value "$WEB_ENV_FILE" "TASK_NUMBER" "$TASK_ID"
set_env_value "$WEB_ENV_FILE" "PORT" "$PORT"
echo "Set TASK_NUMBER=${TASK_ID}, PORT_OFFSET=${PORT_OFFSET}, PORT=${PORT} in ${WEB_ENV_FILE}"

# ── Write per-worktree metadata ───────────────────────────────────────────────
# Plaintext, .env-style file at the worktree root. Gitignored. Read by wt:wrap.

WORKTREE_INFO_FILE="${WORKTREE}/.worktree-info"
{
  echo "TASK_NUMBER=${TASK_ID}"
} > "$WORKTREE_INFO_FILE"
echo "Wrote ${WORKTREE_INFO_FILE}"

# ── Install dependencies ──────────────────────────────────────────────────────

echo "Running pnpm install in the worktree root..."
(cd "$WORKTREE" && pnpm install)
echo "Running pnpm install in web/..."
(cd "${WORKTREE}/web" && pnpm install)

echo ""
echo "✓ Worktree ready at ${WORKTREE}"

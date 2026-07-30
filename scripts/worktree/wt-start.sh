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
  echo "Usage: pnpm wt:start -- <task-number> [--autostart] [--model auto|low|mid|high|<model-id>] [--no-attach]" >&2
  exit 1
fi

TASK_ARG="$1"
shift

AUTOSTART=false
NO_ATTACH=false
MODEL_ARG_RAW=""  # raw --model value; empty = not provided

while [[ $# -gt 0 ]]; do
  case "$1" in
    --autostart)
      AUTOSTART=true
      shift
      ;;
    --no-attach)
      NO_ATTACH=true
      shift
      ;;
    --model)
      if [[ $# -lt 2 ]]; then
        echo "Error: --model requires a value (auto|low|mid|high or a full model ID)" >&2
        exit 1
      fi
      MODEL_ARG_RAW="$2"
      shift 2
      ;;
    *)
      echo "Error: Unknown option: $1" >&2
      echo "Usage: pnpm wt:start -- <task-number> [--autostart] [--model auto|low|mid|high|<model-id>] [--no-attach]" >&2
      exit 1
      ;;
  esac
done

TASK_ID=$(resolve_task_id "$TASK_ARG")

# ── Resolve task ──────────────────────────────────────────────────────────────

TASK_FILE=$(find_task_file "$TASK_ID")

SLUG=$(get_field "$TASK_FILE" slug)
WORKTREE="$(pwd)/worktrees/${TASK_ID}-${SLUG}"
SESSION="${TASK_ID}-${SLUG}"
TASK_PATH="docs/tasks/${TASK_ID}-${SLUG}/TASK.md"

if [[ ! -d "$WORKTREE" ]]; then
  echo "Error: Worktree not found at ${WORKTREE}" >&2
  echo "Run 'pnpm wt:create -- ${TASK_ID}' first." >&2
  exit 1
fi

# ── Validate autostart options ───────────────────────────────────────────────

MODEL=""

if [[ "$AUTOSTART" == true ]]; then
  if ! command -v pi >/dev/null 2>&1; then
    echo "Error: pi CLI not found in PATH" >&2
    exit 1
  fi

  case "$MODEL_ARG_RAW" in
    ""|auto|low|mid|high)
      # Use Pi to select the model via the select-model skill.
      if [[ -z "$MODEL_ARG_RAW" || "$MODEL_ARG_RAW" == "auto" ]]; then
        echo "Selecting model automatically using select-model skill..."
        HINT_TEXT=""
      else
        echo "Selecting model with '${MODEL_ARG_RAW}' complexity hint using select-model skill..."
        HINT_TEXT=" The user provided the '${MODEL_ARG_RAW}' CLI complexity hint (low=fast/cheap, mid=balanced, high=flagship). Use it as a guideline, not as a model name."
      fi
      MODEL=$(pi --print --no-session --model haiku \
        "Read .agents/skills/select-model/SKILL.md and the task at ${TASK_PATH}.${HINT_TEXT} Output ONLY the full model ID to use (e.g. opencode/claude-sonnet-4-5). No explanation, no formatting, just the model ID." \
        2>/dev/null \
        | sed 's/\x1b\[[0-9;]*m//g' \
        | tr -d '\r' \
        | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
        | grep -E '^[a-zA-Z0-9_-]+/[a-zA-Z0-9._-]+$' \
        | tail -1) || true
      if [[ -z "$MODEL" ]]; then
        echo "Warning: Model selection failed; falling back to opencode/claude-sonnet-4-5" >&2
        MODEL="opencode/claude-sonnet-4-5"
      fi
      echo "Selected model: ${MODEL}"
      ;;
    *)
      # Treat as a full model ID and validate it
      MODEL="$MODEL_ARG_RAW"
      MODEL_SEARCH="${MODEL##*/}"
      if ! pi --list-models "$MODEL_SEARCH" 2>&1 | awk -v model="$MODEL" '
        NR > 1 && NF >= 2 && ($1 "/" $2 == model || $2 == model) { found = 1 }
        END { exit found ? 0 : 1 }
      '; then
        echo "Error: Pi model not found: ${MODEL}" >&2
        echo "Run 'pi --list-models ${MODEL_SEARCH}' or 'pi --list-models' to find a valid model ID." >&2
        exit 1
      fi
      ;;
  esac
fi

# ── Create or attach tmux session ────────────────────────────────────────────

SESSION_CREATED=false

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Using existing tmux session '${SESSION}'."
else
  echo "Creating tmux session '${SESSION}' in ${WORKTREE}..."
  tmux new-session -d -s "$SESSION" -c "$WORKTREE"
  SESSION_CREATED=true
fi

if [[ "$AUTOSTART" == true ]]; then
  if [[ "$SESSION_CREATED" == true ]]; then
    PROMPT="Read the execute-task skill at .agents/skills/execute-task/SKILL.md, then read ${TASK_PATH} and execute this task. Follow AGENTS.md and CONTRIBUTING.md. Work only in this worktree. Do not wrap, merge, or remove the worktree."
    printf -v MODEL_ARG '%q' "$MODEL"
    printf -v PROMPT_ARG '%q' "$PROMPT"
    tmux send-keys -t "$SESSION" "pi --model ${MODEL_ARG} ${PROMPT_ARG}" C-m
    echo "Started Pi in session '${SESSION}' with model '${MODEL}'."
  else
    echo "Session already existed; skipping autostart to avoid interrupting active work."
  fi
fi

if [[ "$NO_ATTACH" == true ]]; then
  echo "Detached tmux session ready: ${SESSION}"
  echo "Attach with: tmux attach-session -t ${SESSION}"
  exit 0
fi

if [[ -n "${TMUX:-}" ]]; then
  echo "Switching to session '${SESSION}'..."
  tmux switch-client -t "$SESSION"
else
  echo "Attaching to session '${SESSION}'..."
  tmux attach-session -t "$SESSION"
fi

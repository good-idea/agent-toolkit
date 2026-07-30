#!/usr/bin/env bash
# Prints usage information for all wt:* scripts.

cat <<'EOF'
Worktree scripts — manage Git worktrees around the task workflow.
All worktree branches and pull requests target main.

USAGE
  pnpm wt:create -- <task-number>
  pnpm wt:init   -- <task-number> [wt:start options]
  pnpm wt:start  -- <task-number> [--autostart] [--model auto|low|mid|high|<model-id>] [--no-attach]
  pnpm wt:wrap   -- [--allow-incomplete]
  pnpm wt:help

COMMANDS
  wt:create <task-number>
    Set up a new worktree from main for a task:
      1. Reads docs/tasks/<NNN>-*/TASK.md and marks the task in-progress.
      2. Creates <type>/<id>-<slug> at worktrees/<id>-<slug> from main.
      3. Creates web/.env from web/.env or web/.env.example.
      4. Sets PORT_OFFSET, TASK_NUMBER, and PORT in web/.env.
      5. Runs pnpm install in the worktree root and worktree/web.

  wt:init <task-number> [wt:start options]
    Runs wt:create, then forwards remaining options to wt:start.

  wt:start <task-number> [--autostart] [--model auto|low|mid|high|<model-id>] [--no-attach]
    Open (or attach to) a tmux session named <id>-<slug> rooted in the
    worktree directory.

    Options:
      --autostart          Start Pi in the tmux session to execute the task.
      --model auto         Select a model automatically (also the default).
      --model low|mid|high Provide a complexity hint: fast/cheap, balanced,
                           or flagship. These are not model names.
      --model <model-id>   Use an explicit Pi model ID.
      --no-attach          Create or reuse the tmux session without attaching.

  wt:wrap [--allow-incomplete]
    Run from INSIDE a worktree. Reads the task number from .worktree-info.
    Runs preflight checks only — it does not push, create a PR, or merge:
      1. Confirms the task is completed (skip with --allow-incomplete).
      2. Confirms no uncommitted changes.
      3. Fetches origin/main and checks clean mergeability into main.
      4. Runs pnpm type-check, pnpm lint, and pnpm test.

EXAMPLES
  pnpm wt:create -- 7
  pnpm wt:start -- 7
  pnpm wt:start -- 7 --autostart --model mid --no-attach
  pnpm wt:init -- 7 --autostart --model auto --no-attach
  cd worktrees/007-my-feature && pnpm wt:wrap
EOF

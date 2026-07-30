# Worktree scripts

Bash scripts for the task-worktree workflow. Run commands from the repository root unless noted otherwise. Every worktree branch is created from `main`, and every pull request targets `main`.

```bash
pnpm wt:create -- <task-number>
pnpm wt:init -- <task-number> [wt:start options]
pnpm wt:start -- <task-number> [--autostart] [--model auto|low|mid|high|<model-id>] [--no-attach]
pnpm wt:wrap -- [--allow-incomplete] # run from inside the worktree
pnpm wt:help
```

## `wt:create <task-number>`

`wt:create` prepares a branch named `<type>/<id>-<slug>` from `main` at `worktrees/<id>-<slug>`:

1. Reads `docs/tasks/<NNN>-*/TASK.md` and marks the task `in-progress` with `pnpm task:update`, committing that status update when needed.
2. Creates the Git worktree and branch from `main`.
3. Creates `web/.env` in the worktree by copying an existing `web/.env`, or falling back to `web/.env.example`.
4. Sets `PORT_OFFSET`, `TASK_NUMBER`, and `PORT` in that `web/.env`; `PORT` is `3000 + task number`.
5. Writes `.worktree-info` at the worktree root for `wt:wrap`.
6. Runs `pnpm install` in both the worktree root and `worktree/web`.

The environment-file replacement uses a temporary file rather than platform-specific `sed -i`, so it works on macOS and GNU/Linux.

## `wt:init <task-number> [wt:start options]`

Runs `wt:create`, then forwards its remaining options to `wt:start`.

## `wt:start <task-number>`

Creates or attaches to a tmux session named `<id>-<slug>` rooted in the worktree.

- `--autostart` starts Pi with instructions to execute the task.
- `--model auto` and an omitted `--model` both use automatic model selection through the `select-model` skill.
- `--model low`, `mid`, or `high` provides a CLI complexity hint (fast/cheap, balanced, or flagship). These hints are not model names; the selection skill chooses a model such as `luna`, `terra`, or `sol`.
- `--model <model-id>` uses that explicit Pi model ID.
- `--no-attach` creates or reuses the session without attaching to it.

## `wt:wrap [--allow-incomplete]`

Run this command **inside a worktree** after the implementation has been committed and human-approved as ready for a PR. It does not push, create a PR, or merge code. It:

1. Confirms the task is `completed` unless `--allow-incomplete` is explicitly supplied.
2. Confirms the worktree is clean.
3. Fetches `origin/main` and uses `git merge-tree` to check clean mergeability into `main`.
4. Runs `pnpm type-check`, `pnpm lint`, and `pnpm test`.

After it passes, push the branch and open or update a PR targeting `main`; see the task skill for the full completion flow.

## Shared helpers

`wt-common.sh` defines the canonical `BASE_BRANCH="main"` and helpers for resolving task IDs and frontmatter fields.

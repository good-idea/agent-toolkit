---
name: task
description: >
  Creates, coordinates, or implements tasks. Use when the user references
  a task file (e.g. @docs/tasks/NNN-name/TASK.md), or asks to execute,
  run, start, implement, plan, create, or work on a task.
---

# Task Workflow

## Creating tasks

Use the task creation script to generate new tasks:

```bash
pnpm task:create -- "Task title here" [options]
```

Options:

- `--type` — `feature`, `bug`, `enhancement`, `chore`, `research`, `fix`, `docs`, `refactor`, or `test`
- `--status` — `open`, `in-progress`, `blocked`, `completed`, or `cancelled` (default: `open`)
- `--milestone` — milestone directory name
- `--id` — explicit task ID (normally auto-generated; avoid unless needed)

New tasks always begin with an estimate of `null` (unestimated). Estimates are set only by a human after task creation.

```bash
pnpm task:create -- "Add user authentication" --type=feature
```

Best practices:

- Prefer task scripts over manual edits.
- Create multiple top-level tasks sequentially; ID allocation is not concurrency-safe.
- Fill out the template with known information without doing unrequested research.
- Review similar tasks when useful, and ask the user about uncertain scope or requirements.
- After creating a task, use a commit such as `docs: add task NNN: short description` when asked to commit.

## Updating tasks

- Always run `pnpm task:validate -- <number>` after updating task frontmatter.
- Estimates are human-owned planning metadata. Agents must never assign or change them, even when suggesting one.
- A human may set an estimate with `pnpm task:update -- <number> --estimate=<value>`. Valid values are `1`, `2`, `3`, `5`, `8`, `13`, `21`, or `null` to clear it.
- A task estimated `8` or higher must be decomposed into subtasks before full planning or execution.

## Completing a task

A task is `completed` when its implementation satisfies the approved requirements, all standard checks pass, its changes are committed, and a human has explicitly approved it as ready for a PR. `completed` means **ready for PR**, not already merged. Never mark a task `completed` without human sign-off.

The postmortem belongs in the task document body under `## Postmortem`, never in YAML frontmatter. Before recording models there, run `/session` and use its actual model information.

## Wrap this worktree

When asked to wrap a worktree, work **inside that worktree directory**. `wt:wrap` requires a completed task and a clean worktree, so use this order:

### 1. Review and obtain human approval

- Confirm the implementation is committed and run the standard checks.
- Summarize changed files, validation results, and outstanding items for the user.
- Ask for explicit approval that the implementation is ready for a PR.

### 2. Record completion

After approval, update and validate the task, then commit the task-document change:

```bash
pnpm task:update -- <number> --status=completed
pnpm task:validate -- <number>
git add docs/tasks/<NNN-name>/TASK.md
git commit -m "docs: mark task <NNN> completed"
```

Record any postmortem content in the `## Postmortem` body before committing. Do not place it in frontmatter.

### 3. Run normal preflight

```bash
pnpm wt:wrap
```

The script reads `.worktree-info`; it does not push, create a PR, or merge. It confirms that the task is completed, the worktree is clean, the branch can merge into `origin/main` using `git merge-tree`, and `pnpm type-check`, `pnpm lint`, and `pnpm test` pass.

Use `pnpm wt:wrap -- --allow-incomplete` only for an explicitly requested early diagnostic. It does not replace human approval or the normal completed-task preflight.

### 4. Write the PR description

Inspect the actual work; do not generate a description from commit logs alone:

- Read the task's `TASK.md` and relevant files under `docs/tasks/<NNN-slug>/`.
- Run `git diff origin/main...HEAD --stat` and review the diff.

Write a concise PR description covering the objective, key changes, reviewer notes, and follow-up work.

### 5. Push and open or update the PR

```bash
git push -u origin "$(git branch --show-current)"

gh pr list --head "$(git branch --show-current)" --base main --json number,url

# If none exists, create one targeting main (use --body-file for multi-line descriptions)
gh pr create --base main --head "$(git branch --show-current)" \
  --title "<task title>" \
  --body-file <your-description.md>
```

Report the PR URL. If a PR already exists, report it and update its description if the scope changed.

## Quick orientation

Tasks live under `docs/tasks/NNN-name/` with a `TASK.md` and an optional `subtasks/` directory. The template is at `docs/tasks/000-template/`.

### Status values

`open` · `in-progress` · `blocked` · `completed` · `cancelled`

When starting work on a task, mark it `in-progress`.

### Milestones

Milestones group related tasks under a shared goal. They live at `docs/milestones/NNN-name/MILESTONE.md`. To associate a task with a milestone, set `milestone` in its frontmatter to the milestone directory name (for example, `001-example-milestone`), or leave it `null`.

When a task's `milestone` is not `null`, read its milestone file before work begins. Use its goal, scope, and notes as additional context. If the file does not exist, note that and continue.

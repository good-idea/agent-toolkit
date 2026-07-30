---
name: commit-task
description: >
  Reads the current TASK file, summarizes changed files, runs preflight checks,
  writes a conventional commit message, and marks status 'completed'.
  Run after implementation is done and the user has given approval.
---

# Commit Task

Use this skill to verify a human-approved implementation, commit it, and mark the task completed as ready for a PR. **Do not run it without explicit human approval.** A completed task is ready for a PR; it is not necessarily merged.

## Related skills

- [`task`](../task/SKILL.md) — canonical task rules, status values, and PR workflow
- [`execute-task`](../execute-task/SKILL.md) — direct implementation
- [`orchestrate-task`](../orchestrate-task/SKILL.md) — orchestrated implementation

## 1. Read the task

```text
read docs/tasks/<NNN-name>/TASK.md
```

Confirm the number, title, current status, requirements, and subtasks.

## 2. Summarize changed files

```bash
git diff --name-only HEAD
git status --short
```

Group source, content/data, tests, and documentation/task-file changes. Surface unexpected files before proceeding.

## 3. Run standard checks

```bash
pnpm type-check
pnpm lint
pnpm test
```

If any check fails, report it and do not commit until it is resolved or the user directs otherwise.

## 4. Get session information

Run:

```text
/session
```

Use the actual model information when filling in `## Postmortem`. The postmortem is task-document body content, not YAML frontmatter.

## 5. Present for approval

Show the user:

1. Changed-files summary
2. Results of every standard check
3. Proposed commit message
4. Outstanding items or limitations

Wait for explicit approval before committing or marking the task completed.

## 6. Write and create the implementation commit

Use Conventional Commits with the task number:

```text
<type>: <short description> (#NNN)

<optional body: what changed and why, key decisions>
```

Keep the subject at 72 characters or fewer and write the body in imperative mood. Choose `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, or `agent` as appropriate.

```bash
git add -A
git commit -m "<message>"
```

If working on a worktree branch, check mergeability the same way `wt:wrap` does:

```bash
git fetch origin main
git merge-tree --write-tree origin/main HEAD
```

A non-zero result means the branch cannot cleanly merge into `main`; report and resolve conflicts before opening a PR. Do not use merge-base ancestry as a mergeability check.

## 7. Mark completed

After approval and the implementation commit, update and validate the task:

```bash
pnpm task:update -- <NNN> --status=completed
pnpm task:validate -- <NNN>
```

If needed, add postmortem models and notes under `## Postmortem` in the body, then commit the task-document update:

```bash
git add docs/tasks/<NNN-name>/TASK.md
git commit -m "docs: mark task <NNN> completed"
```

## 8. Final report

Report the commit hash and message, changed-file categories, check results, models from `/session`, and follow-up tasks or known issues. For a worktree, run `pnpm wt:wrap` next and open a PR targeting `main`.

## Rules

- Never mark `completed` without human approval.
- Never skip standard checks.
- Always run `pnpm task:validate -- <number>` after updating frontmatter.
- Keep postmortem content in the body, not frontmatter.

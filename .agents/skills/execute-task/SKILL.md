---
name: execute-task
description: >
  Reads the current TASK file and begins implementation. For complex tasks
  (estimate ≥ 8, or many subtasks), delegates to the orchestrate-task skill
  instead. The executing agent does the work directly.
---

# Execute Task

Use this skill when asked to implement, run, start, or execute a task. It covers orientation, pre-flight decisions, implementation, and hand-off to commit.

## Related skills

- [`task` skill](../task/SKILL.md) — canonical rules for task frontmatter, status values, scripts, estimates
- [`orchestrate-task` skill](../orchestrate-task/SKILL.md) — use instead when the task is large or has multiple independent subtasks
- [`commit-task` skill](../commit-task/SKILL.md) — run after implementation to wrap up and commit
- [`select-model` skill](../select-model/SKILL.md) — use when spawning sub-agents to pick the right model

## Step 1 — Orient

Read the TASK file and supporting context:

```
read docs/tasks/<NNN-name>/TASK.md
read CONTRIBUTING.md          # coding standards
read AGENTS.md                # agent-specific project rules
```

Also read any subtask files listed in the TASK:

```
find docs/tasks/<NNN-name>/subtasks -name "SUBTASK.md" | sort
```

## Step 2 — Decide: execute or orchestrate?

**Escalate to `orchestrate-task`** if any of these are true:

- A human-set task `estimate` is 8 or greater
- There are 3 or more independent subtasks that could run in parallel
- The task involves multiple distinct areas of the codebase with no shared state
- You cannot hold the full implementation plan in a single agent context safely

**Continue here (execute directly)** if:

- Task is self-contained and does not have a human-set estimate of 8 or higher
- Subtasks are sequential or tightly coupled
- One agent can comfortably complete the full scope

## Step 3 — Mark in-progress

Before doing any work, update the task status:

```bash
pnpm task:update -- <NNN> --status=in-progress
```

## Step 4 — Plan

Write out your implementation plan as a short ordered list before touching any source files. Include:

- What you will change and why
- Any decisions that require assumptions — surface these now
- Which subtask(s) you are starting with

If you are uncertain about scope or approach, ask the user before proceeding.

## Step 5 — Implement

Follow the plan. Adhere to `CONTRIBUTING.md` conventions:

- Functional, stateless logic where possible
- Explicit naming, small single-purpose functions
- Use existing patterns before introducing new ones

As you work through subtasks, check them off in the SUBTASK.md file.

## Step 6 — Verify

After implementation, run the project's standard checks from the repo root:

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Tests (if applicable)
pnpm test
```

Fix any errors before proceeding. Do not skip checks.

## Step 7 — Hand off

When implementation is complete and checks pass, summarize:

- What was changed (files, key decisions)
- Any deviations from the original plan and why
- Any open items or follow-up work

Then invoke the [`commit-task` skill](../commit-task/SKILL.md) to wrap up, or wait for explicit user instruction if approval is required first.

## Estimate guardrail

> **Estimates are set only by humans.** `null` means unestimated; never infer a replacement or change it. You may suggest an estimate, but a human must apply it. A human-set Fibonacci estimate of `8` or higher requires subtask decomposition before full planning or execution; a `null` estimate means decide from the task’s actual scope and subtasks instead.

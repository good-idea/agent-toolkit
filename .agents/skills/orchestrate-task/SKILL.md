---
name: orchestrate-task
description: >
  Reads the current TASK file and dispatches sub-agents to do work and review.
  The main agent acts as orchestrator only — it never implements directly.
  Use for tasks with estimate ≥ 8, or 3+ independent subtasks.
---

# Orchestrate Task

Use this skill when a task is too large or parallel to execute in a single agent. The orchestrating agent **plans, dispatches, collects, and synthesizes** — it does not write source code or edit files itself.

## Related skills

- [`task` skill](../task/SKILL.md) — canonical task rules, status values, scripts
- [`execute-task` skill](../execute-task/SKILL.md) — use instead for simpler / self-contained tasks
- [`commit-task` skill](../commit-task/SKILL.md) — run after all sub-agents complete
- [`select-model` skill](../select-model/SKILL.md) — consult before assigning models to sub-agents

## Step 1 — Orient

Read the TASK file and all supporting context:

```
read docs/tasks/<NNN-name>/TASK.md
read CONTRIBUTING.md
read AGENTS.md
```

List all subtasks:

```bash
find docs/tasks/<NNN-name>/subtasks -name "SUBTASK.md" | sort
```

Read each SUBTASK.md. Understand dependencies between subtasks before assigning work.

## Step 2 — Mark in-progress

```bash
pnpm task:update -- <NNN> --status=in-progress
```

## Step 3 — Decompose

A task with a human-set estimate of ≥ 8 must be decomposed into subtasks before full planning or execution. If it does not already have subtasks, propose the breakdown for **human approval** before creating anything. Do not create subtasks autonomously. An estimate of `null` means unestimated and must not be changed by an agent.

Once approved (or if subtasks already exist), build a dispatch plan:

```
Subtask 001: [description]  → agent A (model: terra, parallel: yes)
Subtask 002: [description]  → agent B (model: terra, parallel: yes)
Subtask 003: [description]  → agent C (model: luna, parallel: yes, depends: 001+002)
Final review                → agent D (model: terra, sequential after all)
```

Consult [`select-model`](../select-model/SKILL.md) to assign the right model per role.

## Step 4 — Write sub-agent prompts

Each sub-agent prompt must be **self-contained**: the sub-agent has no memory of this conversation. Include:

1. The task/subtask goal and acceptance criteria (copy from SUBTASK.md)
2. File paths to read for context (TASK.md, AGENTS.md, CONTRIBUTING.md, SUBTASK.md)
3. The exact files or areas to touch
4. Any coding standards or patterns to follow
5. What to write back in the result (summary, files changed, check results)
6. Whether to check off the subtask in SUBTASK.md upon completion

**Do not** tell a sub-agent "use your best judgment" without grounding it in concrete criteria.

## Step 5 — Dispatch

Send independent sub-agents in a **single message** with `run_in_background: true` so they run concurrently. Sequential sub-agents (those with dependencies) must wait for their dependencies to complete first.

```
Agent(
  subagent_type: "general-purpose",
  model: "terra",
  description: "Implement subtask 001: <short label>",
  run_in_background: true,
  isolation: "worktree",   // use when sub-agents modify files in parallel
  prompt: "..."
)
```

Use `isolation: "worktree"` when multiple sub-agents will modify source files concurrently to avoid conflicts.

## Step 6 — Collect and synthesize

When all sub-agents complete:

1. Read each sub-agent's result summary
2. Verify key claims — check actual changed files, don't trust summaries blindly
3. Resolve any conflicts or gaps between sub-agent outputs
4. Run the full project checks yourself (or via a dedicated verification sub-agent):

```bash
pnpm type-check
pnpm lint
pnpm test
```

5. Produce a synthesis report:
   - What was completed vs. what remains
   - Any deviations from plan and why
   - Subtasks passing / failing checks
   - Recommended next action

## Step 7 — Hand off

Present the synthesis report to the user. Wait for approval before proceeding to commit.

Once approved, invoke the [`commit-task` skill](../commit-task/SKILL.md).

## Orchestrator rules

- **Never implement directly.** If you find yourself about to edit a source file, stop and delegate instead.
- **Trust but verify.** Sub-agent summaries describe intent, not outcome. Spot-check actual file changes.
- **Fail loudly.** If a sub-agent fails or its output is incoherent, report it immediately rather than papering over it.
- **Preserve parallelism.** Independent work must run in parallel. Sequential execution of parallelizable work wastes time.
- **Estimate guardrail.** Estimates are human-owned. Never assign or change an estimate; `null` means unestimated.

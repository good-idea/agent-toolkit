# Skills

Agent skills live in `.agents/skills/`. Each skill is a `SKILL.md` file that agents read to learn how to perform a specific type of work. Skills are self-contained: they describe a workflow, not a tool.

## Available skills

| Skill | File | Description |
|-------|------|-------------|
| `task` | `.agents/skills/task/SKILL.md` | Task lifecycle: create, update, validate, list. The starting point for any task work. |
| `execute-task` | `.agents/skills/execute-task/SKILL.md` | Implements a task directly. Orients, plans, implements, verifies, and hands off to `commit-task`. |
| `orchestrate-task` | `.agents/skills/orchestrate-task/SKILL.md` | For large tasks (human-set estimate ≥ 8 or 3+ independent subtasks). Dispatches sub-agents and synthesizes results. |
| `commit-task` | `.agents/skills/commit-task/SKILL.md` | Wraps up a completed task: preflight checks, human approval, conventional commit, marks completed. |
| `select-model` | `.agents/skills/select-model/SKILL.md` | Chooses the right model tier (`luna`/`terra`/`sol`) for a sub-agent role. |
| `interview-me` | `.agents/skills/interview-me/SKILL.md` | Facilitates a reflective one-question-at-a-time interview. |

## Typical flow

```
task skill          → create task, understand lifecycle
execute-task skill  → implement (or escalate to orchestrate-task for large work)
commit-task skill   → run checks, get approval, commit, mark completed
```

`wt:start --autostart` invokes `execute-task` automatically when creating a worktree session.

## Adding a skill

Create `.agents/skills/<name>/SKILL.md` with a YAML front matter block:

```yaml
---
name: skill-name
description: >
  One or two sentences describing when to use this skill.
---
```

Skills cross-reference each other using relative paths (e.g. `../task/SKILL.md`). Keep skills focused on a single workflow phase.

## Agent tool configuration

By default, skills live in `.agents/skills/`. Configure your agent tool to read from that path:

- **Pi**: `.agents/skills/` is discovered automatically. Use `.pi/skills/` as the project-local alternative when you need Pi-specific skills.
- **Claude Code**: symlink `.claude/skills` → `.agents/skills`
- **Other tools**: consult your tool's documentation for skill/context directory configuration

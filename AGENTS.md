# Agent Guidelines

Before starting work, orient yourself:

1. Read the relevant `TASK.md` in `docs/tasks/<NNN-name>/`
2. Read `CONTRIBUTING.md` for code style and commit conventions
3. Use the skills in `.agents/skills/` for task execution, orchestration, and model selection

## Skills

See `docs/SKILLS.md` for an overview. The key starting points:

- **Starting a task** → `.agents/skills/execute-task/SKILL.md`
- **Large / parallel task** → `.agents/skills/orchestrate-task/SKILL.md`
- **Committing & closing** → `.agents/skills/commit-task/SKILL.md`
- **Full task lifecycle** → `.agents/skills/task/SKILL.md`

## Working in worktrees

If you are running inside a worktree (`worktrees/<NNN>-<slug>/`), work only within this directory. Do not push, merge, or remove the worktree unless explicitly instructed.

## Checks

Before committing, run:

```bash
pnpm type-check
pnpm lint
pnpm test
```

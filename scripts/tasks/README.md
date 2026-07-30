# Task scripts

Run task scripts from the repository root. Use `--` to forward positional arguments and flags through `pnpm`:

```bash
pnpm task:create -- "My task title" --type=feature
pnpm task:list -- --status=open,in-progress
pnpm task:update -- 001 --status=in-progress
pnpm task:validate -- 001
pnpm task:validate -- docs/tasks/001-my-task/TASK.md
pnpm task:validate-all
pnpm task:fix-order
```

The scripts also normalize one leading forwarded `--`, so the documented forms work consistently when `pnpm` passes that separator to Node. Prefer the forms above; without the separator, leading flags can be interpreted by `pnpm` rather than the task script.

## Frontmatter fields

| Field       | Type                | Description                                                                                     |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `id`        | `"001"`             | Zero-padded 3-digit ID, auto-allocated by `task:create`                                         |
| `title`     | string              | Human-readable task title                                                                       |
| `slug`      | string              | URL-safe slug derived from the directory name                                                   |
| `type`      | enum                | `feature` · `bug` · `enhancement` · `chore` · `research` · `fix` · `docs` · `refactor` · `test` |
| `status`    | enum                | `open` · `in-progress` · `blocked` · `completed` · `cancelled`                                  |
| `estimate`  | Fibonacci \| `null` | Human-set story points: `1`, `2`, `3`, `5`, `8`, `13`, `21`, or `null` while unestimated        |
| `milestone` | string \| `null`    | Milestone directory name (for example, `001-initial-release`), or `null`                        |
| `created`   | ISO date            | Set automatically on creation                                                                   |
| `updated`   | ISO date            | Updated automatically by `task:update`                                                          |

## `task:update` flags

```text
pnpm task:update -- <number> [options]

Options:
  --status=<value>     open | in-progress | blocked | completed | cancelled
  --type=<value>       feature | bug | enhancement | chore | research | fix | docs | refactor | test
  --title=<value>      New task title
  --milestone=<value>  Milestone ID, or "null" to clear
  --estimate=<value>   Fibonacci number (1 | 2 | 3 | 5 | 8 | 13 | 21), or "null" to clear
```

Always run `pnpm task:validate -- <number>` after updating frontmatter.

## Estimates and subtasks

Estimates are human-owned planning metadata. New tasks always start at `null`; agents must not assign or change estimates. A human-set estimate of `8` or greater requires subtask decomposition before full planning or execution.

Generated task documents explain how to add optional `subtasks/` files, but do not include placeholder subtask links.

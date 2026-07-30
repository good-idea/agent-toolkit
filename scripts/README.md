# Scripts

Repository-maintenance scripts are grouped by workflow:

- [Task scripts](./tasks/README.md) — task creation, updates, validation, and listing (`pnpm task:*`).
- [Worktree scripts](./worktree/README.md) — task worktree lifecycle (`pnpm wt:*`).

## Direct utilities

These utilities have no `pnpm` alias and are invoked directly:

- `node scripts/run-package-command.mjs <script-name>` — run a package script across configured workspace packages.
- `bash scripts/get_service_port.sh dev` — read the configured development port from `web/.env`.

# Scripts

This repository uses `pnpm`. Install dependencies with:

```bash
pnpm install
```

## Canonical documentation

- [Task scripts](../scripts/tasks/README.md) — create, update, validate, list, and repair task documents.
- [Worktree scripts](../scripts/worktree/README.md) — create, start, and preflight task worktrees. All worktree branches and pull requests target `main`.
- [Script index](../scripts/README.md) — direct utility scripts and their invocation.

## Standard checks

```bash
pnpm type-check
pnpm lint
pnpm test
```

`pnpm test` runs both the Vitest task-script tests and the Node utility-script tests.

## Direct utilities

Not every utility has a `pnpm` alias. Invoke these scripts directly:

```bash
node scripts/run-package-command.mjs <script-name>
bash scripts/get_service_port.sh dev
```

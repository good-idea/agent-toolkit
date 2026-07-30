---
name: select-model
description: >
  A skill agents can use to pick the appropriate model for a particular piece
  of work. Covers cost/capability trade-offs, task complexity signals, and
  recommended defaults for common sub-agent roles.
---

# Select Model

Use this skill to choose the right model before spawning a sub-agent or switching models for a new phase of work. The goal is **minimum cost for the required capability** — do not default to the most powerful model when a cheaper one is sufficient.

## Model tiers

| Tier           | Fuzzy name | Anthropic example   | OpenAI example      | Best for                                                                                                              |
| -------------- | ---------- | ------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Flagship**   | `sol`      | `claude-opus-4-5`   | `gpt-5.6` (sol)     | Complex reasoning, architecture design, multi-step synthesis, ambiguous requirements, final review of critical output |
| **Balanced**   | `terra`    | `claude-sonnet-4-5` | `gpt-5.6` (terra)   | Most implementation work, code generation, visual analysis, moderate complexity sub-agents                            |
| **Fast/cheap** | `luna`     | `claude-haiku-4-5`  | `gpt-5.6` (luna)    | Simple lookups, grep-and-report, file reads, repetitive mechanical transforms, browser automation loops               |

> Prefer fuzzy names (`sol`, `terra`, `luna`) so this skill stays stable across model releases. Use full model IDs only when you need a specific version.

## Decision guide

### Use **Fast/cheap** (`luna`) when the agent will:

- Read files and report structured findings without synthesis
- Run a single CLI command and return stdout
- Perform repetitive mechanical work (e.g., check off items, append log lines)
- Drive Playwright sessions (browser automation loops)
- Parse and extract data from a known format

### Use **Balanced** (`terra`) when the agent will:

- Write or refactor code
- Perform visual diff analysis or image comparison
- Execute a multi-step sub-task with moderate judgment
- Investigate an unfamiliar codebase section
- Orchestrate a small number of sequential steps

### Use **Flagship** (`sol`) when the agent will:

- Design or review architecture
- Resolve ambiguous requirements or conflicting constraints
- Perform the final human-facing review / approval synthesis
- Handle a task with a human-set estimate ≥ 8
- Work on security, accessibility, or correctness-critical code paths

## Thinking level

If the selected model supports extended thinking, set it explicitly:

| Scenario                               | `thinking` value  |
| -------------------------------------- | ----------------- |
| Routine work                           | `off` or omit     |
| Implementation with non-trivial logic  | `low` or `medium` |
| Architecture / complex synthesis       | `high`            |
| Debugging a subtle correctness problem | `high` or `xhigh` |

## Practical rules

- **Never upgrade unnecessarily.** If **Fast/cheap** is sufficient, use it. Token cost compounds fast across many sub-agents.
- **Match model to output complexity, not input complexity.** A large codebase lookup is still **Fast/cheap** work if the answer is a list of file paths.
- **Escalate within a task, not upfront.** Start with **Balanced** for implementation sub-agents; escalate a specific sub-agent to **Flagship** only when it encounters genuinely hard decisions.
- When in doubt, default to **Balanced**.

## Using this skill

Read this file at the start of any orchestration phase where you will spawn multiple sub-agents. Apply the decision guide per sub-agent role, then record your choices in your reasoning before spawning.

Example reasoning pattern:

```
- Audit sub-agents (read + report): luna
- Implementation sub-agents (write code): terra
- Final review + commit summary: terra
- Architecture decision (blocking ambiguity): sol
```

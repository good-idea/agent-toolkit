---
id: "005"
title: "Validate CSS and run checks"
type: "test"
status: "open"
---

# Subtask: Validate CSS and run checks

## Summary

Validate CSS syntax, run linting and type checks, and verify that stylesheets load correctly.

## Requirements

- [ ] Verify CSS files are syntactically valid
- [ ] Run `pnpm lint` with no errors or warnings
- [ ] Run `pnpm type-check` with no errors
- [ ] Confirm stylesheets load correctly in the browser (visual inspection)

## Implementation

Execute the following checks:
1. CSS syntax validation (visual inspection or CSS linter)
2. Run project linting: `pnpm lint`
3. Run type checking: `pnpm type-check`
4. Test in browser to ensure styles apply correctly

## Dependencies

- All previous subtasks (001-004) should be completed first

## Files to Update

- Verify: `web/styles/reset.css`
- Verify: `web/styles/global.css`
- Verify: `web/src/index.html`

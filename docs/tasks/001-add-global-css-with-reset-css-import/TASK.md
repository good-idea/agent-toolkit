---
id: '001'
title: 'Add global.css with reset.css import'
slug: 'add-global-css-with-reset-css-import'
type: 'feature'
status: 'in-progress'
estimate: null
milestone: null
created: '2026-07-30'
updated: '2026-07-30'
---

# Add global.css with reset.css import

## Summary

Create a `web/styles/reset.css` and `web/styles/global.css` that imports the reset stylesheet, providing a consistent baseline for styling across the hello world project.

## Context

CSS resets normalize default browser styles to ensure consistent rendering across different browsers. A global stylesheet provides a single entry point for project-wide styling and typography.

## Requirements

- [ ] Create `web/styles/reset.css` with a standard CSS reset (remove default margins, padding, set base font, etc.)
- [ ] Create `web/styles/global.css` that imports reset.css using `@import url('./reset.css');`
- [ ] Import `global.css` in the HTML file (link tag in head)
- [ ] Verify both files are properly formatted and syntactically valid

## Approach

1. Create `web/styles/` directory if it doesn't exist
2. Add reset.css with modern CSS reset patterns (e.g., normalize margins, set box-sizing, base typography)
3. Create global.css with @import statement
4. Link global.css in the HTML document head

## Subtasks

Create files in `./subtasks/` only when this task needs to be broken into independently trackable work. List each created subtask here with a link to its `SUBTASK.md` file.

---

## Postmortem

**Models:** Run `/session` and record the models used.
**Notes:** What went well, what was tricky, approximations made, and anything to improve next time.

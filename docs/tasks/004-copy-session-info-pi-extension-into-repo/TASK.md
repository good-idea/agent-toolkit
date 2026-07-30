---
id: "004"
title: "Copy session-info PI extension into repo"
slug: "copy-session-info-pi-extension-into-repo"
type: "feature"
status: "open"
estimate: null
milestone: null
created: "2026-07-30"
updated: "2026-07-30"
---

# Copy session-info PI extension into repo

## Summary

Copy the `session-info` PI extension from the global pi installation into the agent-toolkit repository so it becomes a project-level extension.

## Context

PI extensions can be installed globally or per-project. Project-level extensions override global ones and are version-controlled with the repository. The session-info extension provides useful session metadata and should be available to contributors working on this project.

## Requirements

- [ ] Locate the global `session-info` extension in the pi installation
- [ ] Copy the extension files to `.agents/extensions/session-info/` in the repo
- [ ] Verify the extension structure is correct (should include manifest, implementation, etc.)
- [ ] Test that the extension loads and functions correctly in the project context
- [ ] Commit the extension files to version control

## Approach

1. Find the global session-info extension location (likely in ~/.pi/ or pi installation directory)
2. Review its structure to understand what needs to be copied
3. Create `.agents/extensions/session-info/` directory structure in the repo
4. Copy extension files (manifest.json, implementation code, etc.)
5. Test the extension by invoking it within the project context
6. Verify it works as expected and doesn't produce errors

## Subtasks

Create files in `./subtasks/` only when this task needs to be broken into independently trackable work. List each created subtask here with a link to its `SUBTASK.md` file.

---

## Postmortem

**Models:** Run `/session` and record the models used.
**Notes:** What went well, what was tricky, approximations made, and anything to improve next time.

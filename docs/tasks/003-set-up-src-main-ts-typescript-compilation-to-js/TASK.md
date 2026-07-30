---
id: '003'
title: 'Set up src/main.ts TypeScript compilation to JS'
slug: 'set-up-src-main-ts-typescript-compilation-to-js'
type: 'feature'
status: 'completed'
estimate: null
milestone: null
created: '2026-07-30'
updated: '2026-07-30'
---

# Set up src/main.ts TypeScript compilation to JS

## Summary

Set up a TypeScript build pipeline that compiles `src/main.ts` to JavaScript and serves it with the HTML, enabling the project to use TypeScript for type-safe scripting.

## Context

TypeScript provides type safety and modern language features that improve developer experience. The hello world project needs to compile TypeScript to JavaScript that can be loaded by the browser. The compiled output should be served in the web directory and referenced in the HTML.

## Requirements

- [x] Create `src/main.ts` with a simple "hello world" console log or DOM manipulation
- [x] Configure TypeScript compiler to output compiled JS to `web/` directory
- [x] Ensure `tsconfig.json` includes proper settings for web/browser targeting
- [x] Add a `<script>` tag in the HTML that loads the compiled JS file
- [x] Verify the compilation works via build command (e.g., `pnpm run build` or similar)
- [x] The compiled JavaScript is executable in the browser with no errors

## Approach

1. Create `src/` directory and `src/main.ts` file with sample code
2. Update `tsconfig.json` to set output directory to `web/dist/` (or appropriate location)
3. Add build script to `package.json` if not already present (e.g., `tsc`)
4. Compile TypeScript and verify output JS exists
5. Add `<script src="./dist/main.js"></script>` to HTML
6. Test that the script runs in the browser without errors

## Subtasks

Create files in `./subtasks/` only when this task needs to be broken into independently trackable work. List each created subtask here with a link to its `SUBTASK.md` file.

---

## Postmortem

**Models:** claude-sonnet-4-5 (30 turns, 777k tokens, $0.61)

**Notes:** 

*What went well:*
- Clean separation of concerns: created `tsconfig.web.json` to avoid conflicts with the existing NodeNext-configured `tsconfig.json`
- Build pipeline straightforward: added `build` and `build:watch` scripts
- All checks passed on first run after implementation
- The `dist/` directory was already in `.gitignore`, so no additional configuration needed

*Key decisions:*
- Output directory: `web/src/dist/` keeps compiled JS alongside HTML for simple serving
- Used ES2022 with DOM libs for modern browser features
- Included both console.log and DOM manipulation in the example to demonstrate both capabilities

*Nothing tricky:* Implementation was straightforward, followed the task requirements exactly.

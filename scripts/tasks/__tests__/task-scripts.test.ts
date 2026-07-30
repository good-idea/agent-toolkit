import { describe, expect, it } from 'vitest'
import { createTask, listTaskLines, validateDocuments } from '../app.js'
import { taskScriptArgs } from '../shared.js'
import { createInMemoryTaskAdapter } from './test-utils.js'

describe('task scripts', () => {
  it("accepts pnpm's forwarded argument separator", () => {
    const originalArgv = process.argv
    process.argv = ['node', 'script', '--', '001', '--estimate=8']

    try {
      expect(taskScriptArgs()).toEqual(['001', '--estimate=8'])
    } finally {
      process.argv = originalArgv
    }
  })

  it('creates a task using the template and auto-allocates an id', async () => {
    const { adapter, state } = createInMemoryTaskAdapter({
      taskDirectories: ['docs/tasks/001-existing-task'],
    })

    const result = await createTask(adapter, {
      title: 'Write task script tests',
      type: 'docs',
      status: 'completed',
    })

    expect(result.taskId).toBe('002')
    expect(result.taskDirectoryName).toBe('002-write-task-script-tests')
    expect(result.taskFilePath).toBe(
      'docs/tasks/002-write-task-script-tests/TASK.md'
    )
    expect(state.writes).toHaveLength(1)
    expect(state.writes[0]?.markdown).toContain(
      'slug: "write-task-script-tests"'
    )
    expect(state.writes[0]?.markdown).toContain('status: "completed"')
    expect(state.writes[0]?.markdown).toContain('estimate: null')
    expect(state.writes[0]?.markdown).toContain(
      'Create files in the ./subtasks/ directory only when this task needs to be broken'
    )
    expect(state.writes[0]?.markdown).not.toContain('priority')
  })

  it('removes template-only HTML comments when generating a task', async () => {
    const { adapter, state } = createInMemoryTaskAdapter({
      template: `---
id: '000'
title: '[Task Title]'
slug: 'template'
type: 'feature'
status: 'open'
estimate: null
milestone: null
created: '2026-04-22'
updated: '2026-04-22'
---

# [Task Title]

<!-- Template-only guidance -->

## Subtasks

Create files in \`./subtasks/\` only when needed.

- [ ] Placeholder [subtask](./subtasks/001-placeholder/SUBTASK.md)
`,
    })

    await createTask(adapter, { title: 'Generated task' })

    expect(state.writes[0]?.markdown).not.toContain('<!--')
    expect(state.writes[0]?.markdown).not.toContain(
      './subtasks/001-placeholder/SUBTASK.md'
    )
    expect(state.writes[0]?.markdown).toContain(
      'Create files in `./subtasks/` only when needed.'
    )
  })

  it('validates task frontmatter and fails on invalid values', async () => {
    const { adapter } = createInMemoryTaskAdapter({
      documents: [
        {
          kind: 'task',
          path: 'docs/tasks/001-valid-task/TASK.md',
          frontmatter: {
            id: '001',
            title: 'Valid task',
            slug: 'valid-task',
            type: 'docs',
            status: 'open',
            estimate: 3,
            created: '2026-04-22',
            updated: '2026-04-22',
          },
          body: '# Valid task',
        },
        {
          kind: 'task',
          path: 'docs/tasks/002-invalid-task/TASK.md',
          frontmatter: {
            id: '002',
            title: 'Broken task',
            slug: 'invalid-task',
            type: 'invalid-type',
            status: 'open',
            estimate: 3,
            created: '2026-04-22',
            updated: '2026-04-22',
          },
          body: '# Broken task',
        },
      ],
    })

    const result = await validateDocuments(adapter, [])

    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain(
      'docs/tasks/002-invalid-task/TASK.md'
    )
    expect(result.errors.join('\n')).toContain('invalid_value')
  })

  it('validates that task slug matches the file path', async () => {
    const { adapter } = createInMemoryTaskAdapter({
      documents: [
        {
          kind: 'task',
          path: 'docs/tasks/001-valid-task/TASK.md',
          frontmatter: {
            id: '001',
            title: 'Valid task',
            slug: 'wrong-slug',
            type: 'docs',
            status: 'open',
            estimate: 3,
            created: '2026-04-22',
            updated: '2026-04-22',
          },
          body: '# Valid task',
        },
      ],
    })

    const result = await validateDocuments(adapter, [])

    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('Task slug mismatch')
  })

  it('accepts null task estimates', async () => {
    const { adapter } = createInMemoryTaskAdapter({
      documents: [
        {
          kind: 'task',
          path: 'docs/tasks/001-unestimated-task/TASK.md',
          frontmatter: {
            id: '001',
            title: 'Unestimated task',
            slug: 'unestimated-task',
            type: 'docs',
            status: 'open',
            estimate: null,
            created: '2026-04-22',
            updated: '2026-04-22',
          },
          body: '# Unestimated task',
        },
      ],
    })

    const result = await validateDocuments(adapter, [])

    expect(result.ok).toBe(true)
  })

  it('rejects non-Fibonacci task estimates', async () => {
    const { adapter } = createInMemoryTaskAdapter({
      documents: [
        {
          kind: 'task',
          path: 'docs/tasks/001-invalid-estimate/TASK.md',
          frontmatter: {
            id: '001',
            title: 'Invalid estimate',
            slug: 'invalid-estimate',
            type: 'docs',
            status: 'open',
            estimate: 4,
            created: '2026-04-22',
            updated: '2026-04-22',
          },
          body: '# Invalid estimate',
        },
      ],
    })

    const result = await validateDocuments(adapter, [])

    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain(
      'Estimate must be 1, 2, 3, 5, 8, 13, 21, or null'
    )
  })

  it('requires subtask titles in frontmatter', async () => {
    const { adapter } = createInMemoryTaskAdapter({
      documents: [
        {
          kind: 'subtask',
          path: 'docs/tasks/001-valid-task/subtasks/001-missing-title/SUBTASK.md',
          frontmatter: {
            id: '001',
            type: 'docs',
            status: 'open',
          },
          body: '# Missing title',
        },
      ],
    })

    const result = await validateDocuments(adapter, [])

    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain(
      'docs/tasks/001-valid-task/subtasks/001-missing-title/SUBTASK.md'
    )
    expect(result.errors.join('\n')).toContain('title')
  })

  it('lists nested tasks and filters by status', async () => {
    const { adapter } = createInMemoryTaskAdapter({
      taskTree: [
        {
          id: '001',
          title: 'Open parent',
          status: 'open',
          children: [
            {
              id: '001-001',
              title: 'Completed child',
              status: 'completed',
              children: [],
            },
          ],
        },
        {
          id: '002',
          title: 'In-progress parent',
          status: 'in-progress',
          children: [],
        },
        {
          id: '003',
          title: 'Completed parent',
          status: 'completed',
          children: [],
        },
      ],
    })

    const unfiltered = await listTaskLines(adapter)
    expect(unfiltered).toContain('- [ ] 001 Open parent')
    expect(unfiltered).toContain('  - [x] 001-001 Completed child')
    expect(unfiltered).toContain('- [~] 002 In-progress parent')
    expect(unfiltered).toContain('- [x] 003 Completed parent')

    const filtered = await listTaskLines(adapter, new Set(['completed']))
    expect(filtered).toContain('- [ ] 001 Open parent')
    expect(filtered).toContain('  - [x] 001-001 Completed child')
    expect(filtered).toContain('- [x] 003 Completed parent')
    expect(filtered).not.toContain('In-progress parent')
  })
})

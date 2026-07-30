import type {
  TaskDocumentInput,
  TaskScriptAdapter,
  TaskTreeNode,
} from '../ports.js'

export type InMemoryTaskAdapterOptions = {
  template?: string
  now?: string
  taskDirectories?: string[]
  documents?: TaskDocumentInput[]
  taskTree?: TaskTreeNode[]
}

export function createInMemoryTaskAdapter(
  options: InMemoryTaskAdapterOptions = {}
): {
  adapter: TaskScriptAdapter
  state: {
    writes: Array<{
      taskDirectoryName: string
      markdown: string
      taskFilePath: string
    }>
    taskDirectories: string[]
    documents: TaskDocumentInput[]
    taskTree: TaskTreeNode[]
  }
} {
  const state = {
    writes: [] as Array<{
      taskDirectoryName: string
      markdown: string
      taskFilePath: string
    }>,
    taskDirectories: [...(options.taskDirectories ?? [])],
    documents: [...(options.documents ?? [])],
    taskTree: options.taskTree ?? [],
  }

  const adapter: TaskScriptAdapter = {
    now() {
      return options.now ?? '2026-04-22'
    },
    async listTaskDirectories() {
      return [...state.taskDirectories]
    },
    allocateTaskId(existingTaskDirectories: string[]) {
      const nextId =
        existingTaskDirectories.reduce((maximum, directory) => {
          const match = /^(\d{3})-/.exec(directory.split('/').at(-1) ?? '')
          if (!match) {
            return maximum
          }

          return Math.max(maximum, Number(match[1]))
        }, 0) + 1

      return String(nextId).padStart(3, '0')
    },
    async readTaskTemplate() {
      return options.template ?? DEFAULT_TEMPLATE
    },
    async writeTask(taskDirectoryName: string, taskMarkdown: string) {
      const taskFilePath = `docs/tasks/${taskDirectoryName}/TASK.md`
      state.writes.push({
        taskDirectoryName,
        markdown: taskMarkdown,
        taskFilePath,
      })
      state.taskDirectories.push(`docs/tasks/${taskDirectoryName}`)
      return taskFilePath
    },
    async loadTaskDocuments(targets: string[]) {
      if (targets.length === 0) {
        return [...state.documents]
      }

      const normalizedTargets = targets.map((target) =>
        target.replace(/\\/g, '/')
      )

      return state.documents.filter((document) =>
        normalizedTargets.some(
          (target) =>
            document.path === target || document.path.startsWith(`${target}/`)
        )
      )
    },
    async loadTaskTree() {
      return state.taskTree
    },
  }

  return { adapter, state }
}

const DEFAULT_TEMPLATE = `---
id: '000'
title: '[Task Title]'
slug: 'task-title'
type: 'feature'
status: 'open'
created: '2026-04-22'
updated: '2026-04-22'
---

# [Task Title]

## Summary

Brief description of what needs to be accomplished.

## Subtasks

Create files in the ./subtasks/ directory only when this task needs to be broken into independently trackable work. List each created subtask here with a link to its SUBTASK.md file.
`

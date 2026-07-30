import type { TaskFrontmatter, TaskStatus } from './shared.js'

export type TaskDocumentInput = {
  kind: 'task' | 'subtask'
  path: string
  frontmatter: unknown
  body: string
}

export type TaskTreeNode = {
  id: string
  title: string
  status: TaskStatus
  children: TaskTreeNode[]
}

export type CreateTaskInput = {
  id?: string
  title: string
  type?: TaskFrontmatter['type']
  status?: TaskFrontmatter['status']
  slug?: string
  milestone?: string | null
}

export type CreateTaskResult = {
  taskId: string
  taskDirectoryName: string
  taskFilePath: string
}

export type ValidationResult = {
  ok: boolean
  errors: string[]
}

export interface TaskScriptAdapter {
  now(): string
  listTaskDirectories(): Promise<string[]>
  allocateTaskId(existingTaskDirectories: string[]): string
  readTaskTemplate(): Promise<string>
  writeTask(taskDirectoryName: string, taskMarkdown: string): Promise<string>
  loadTaskDocuments(targets: string[]): Promise<TaskDocumentInput[]>
  loadTaskTree(): Promise<TaskTreeNode[]>
}

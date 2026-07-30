import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

export const TASKS_ROOT = path.resolve(process.cwd(), 'docs/tasks')

const TASK_FILE_RE = /^(\d{3})-[^/]+\/TASK\.md$/
const SUBTASK_FILE_RE = /^(\d{3})-[^/]+\/subtasks\/(\d{3})-[^/]+\/SUBTASK\.md$/

const TASK_TYPES = [
  'feature',
  'bug',
  'enhancement',
  'chore',
  'research',
  'fix',
  'docs',
  'refactor',
  'test',
] as const

const STATUSES = [
  'open',
  'in-progress',
  'blocked',
  'completed',
  'cancelled',
] as const

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const taskStatusSchema = z.enum(STATUSES)

const ESTIMATES = [1, 2, 3, 5, 8, 13, 21] as const

const estimateSchema = z.union([
  z.null(),
  z.coerce
    .number()
    .int()
    .refine(
      (value) => ESTIMATES.includes(value as (typeof ESTIMATES)[number]),
      {
        message: 'Estimate must be 1, 2, 3, 5, 8, 13, 21, or null',
      }
    ),
])

const milestoneIdSchema = z
  .string()
  .regex(/^\d{3}-[a-z0-9-]+$/)
  .nullable()

/**
 * Slug used in the task directory name (the part after `NNN-`).
 * Suggestion: keep slugs under 25 characters for readability.
 */
export const taskSlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/)

export const taskFrontmatterSchema = z
  .object({
    id: z.string().regex(/^\d{3}$/),
    title: z.string().min(1),
    slug: taskSlugSchema,
    type: z.enum(TASK_TYPES),
    status: taskStatusSchema,
    estimate: estimateSchema,
    created: isoDateSchema,
    updated: isoDateSchema,
    milestone: milestoneIdSchema.optional(),
  })
  .strict()

export const subtaskFrontmatterSchema = z
  .object({
    id: z.string().regex(/^\d{3}$/),
    title: z.string().min(1),
    type: z.enum(TASK_TYPES),
    status: taskStatusSchema,
  })
  .strict()

export type TaskFrontmatter = z.infer<typeof taskFrontmatterSchema>
export type SubtaskFrontmatter = z.infer<typeof subtaskFrontmatterSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>

export function stripInlineComment(value: string): string {
  let inSingleQuotes = false
  let inDoubleQuotes = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    const previousCharacter = value[index - 1]

    if (character === "'" && !inDoubleQuotes && previousCharacter !== '\\') {
      inSingleQuotes = !inSingleQuotes
      continue
    }

    if (character === '"' && !inSingleQuotes && previousCharacter !== '\\') {
      inDoubleQuotes = !inDoubleQuotes
      continue
    }

    if (
      character === '#' &&
      !inSingleQuotes &&
      !inDoubleQuotes &&
      (index === 0 || /\s/.test(previousCharacter ?? ''))
    ) {
      return value.slice(0, index).trimEnd()
    }
  }

  return value.trimEnd()
}

export function parseScalarValue(rawValue: string): unknown {
  const value = stripInlineComment(rawValue).trim()

  if (value === 'null') return null
  if (value === 'true') return true
  if (value === 'false') return false

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

export function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(markdown)

  if (!match) {
    throw new Error('Missing YAML frontmatter')
  }

  const frontmatterBlock = match[1]
  const body = match[2]
  const frontmatter: Record<string, unknown> = {}

  for (const line of frontmatterBlock.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf(':')

    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line: ${line}`)
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim()

    frontmatter[key] = parseScalarValue(rawValue)
  }

  return { frontmatter, body }
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

export function getRelativeTaskFilePath(filePath: string): string {
  return toPosixPath(path.relative(TASKS_ROOT, filePath))
}

export function isTaskFile(filePath: string): boolean {
  return TASK_FILE_RE.test(toPosixPath(filePath))
}

export function isSubtaskFile(filePath: string): boolean {
  return SUBTASK_FILE_RE.test(toPosixPath(filePath))
}

export function getTaskFilePathFromDirectory(taskDirectory: string): string {
  return path.join(taskDirectory, 'TASK.md')
}

export function getSubtaskFilePathFromDirectory(
  subtaskDirectory: string
): string {
  return path.join(subtaskDirectory, 'SUBTASK.md')
}

export function checkboxForStatus(status: TaskStatus): '[ ]' | '[x]' {
  return status === 'completed' ? '[x]' : '[ ]'
}

export function includesStatusFilter(
  filter: ReadonlySet<TaskStatus> | null,
  status: TaskStatus
): boolean {
  return filter === null || filter.has(status)
}

export function taskScriptArgs(): string[] {
  const args = process.argv.slice(2)
  return args[0] === '--' ? args.slice(1) : args
}

export function parseStatusFilter(
  rawValue: string | undefined
): ReadonlySet<TaskStatus> | null {
  if (!rawValue) {
    return null
  }

  const parsedStatuses = rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => taskStatusSchema.parse(value))

  return parsedStatuses.length > 0 ? new Set(parsedStatuses) : null
}

export function createTaskDirectoryName(id: string, title: string): string {
  return `${id}-${slugify(title)}`
}

/**
 * Extract the slug portion from a task directory name.
 * E.g. "005-update-task-schema" → "update-task-schema"
 */
export function extractSlugFromDirectoryName(directoryName: string): string {
  const match = /^\d{3}-(.+)$/.exec(directoryName)
  if (!match) {
    throw new Error(`Invalid task directory name: ${directoryName}`)
  }
  return match[1]
}

export function extractTaskSlugFromFilePath(filePath: string): string {
  return extractSlugFromDirectoryName(path.basename(path.dirname(filePath)))
}

export function extractTaskIdFromFilePath(filePath: string): string {
  const directoryName = path.basename(path.dirname(filePath))
  const match = /^(\d{3})-/.exec(directoryName)
  if (!match) {
    throw new Error(`Invalid task directory name: ${directoryName}`)
  }
  return match[1]
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8')
}

export async function listTaskDirectories(
  tasksRoot = TASKS_ROOT
): Promise<string[]> {
  const entries = await readdir(tasksRoot, { withFileTypes: true })

  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        /^\d{3}-/.test(entry.name) &&
        entry.name !== '000-template'
    )
    .map((entry) => path.join(tasksRoot, entry.name))
}

export async function listSubtaskDirectories(
  taskDirectory: string
): Promise<string[]> {
  const subtasksDirectory = path.join(taskDirectory, 'subtasks')

  try {
    const entries = await readdir(subtasksDirectory, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name))
      .map((entry) => path.join(subtasksDirectory, entry.name))
  } catch {
    return []
  }
}

export function sortByNumericPrefix(paths: string[]): string[] {
  return [...paths].sort((left, right) => {
    const leftMatch = /^(\d{3})-/.exec(path.basename(left))
    const rightMatch = /^(\d{3})-/.exec(path.basename(right))
    const leftNumber = leftMatch
      ? Number(leftMatch[1])
      : Number.POSITIVE_INFINITY
    const rightNumber = rightMatch
      ? Number(rightMatch[1])
      : Number.POSITIVE_INFINITY

    return (
      leftNumber - rightNumber ||
      path.basename(left).localeCompare(path.basename(right))
    )
  })
}

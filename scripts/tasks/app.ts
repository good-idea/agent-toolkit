import {
  createTaskDirectoryName,
  extractSlugFromDirectoryName,
  extractTaskSlugFromFilePath,
  extractTaskIdFromFilePath,
  subtaskFrontmatterSchema,
  taskFrontmatterSchema,
  type TaskStatus,
} from './shared.js'
import type {
  CreateTaskInput,
  CreateTaskResult,
  TaskDocumentInput,
  TaskTreeNode,
  TaskScriptAdapter,
  ValidationResult,
} from './ports.js'

export async function createTask(
  adapter: TaskScriptAdapter,
  input: CreateTaskInput
): Promise<CreateTaskResult> {
  const existingTaskDirectories = await adapter.listTaskDirectories()
  const taskId = input.id ?? adapter.allocateTaskId(existingTaskDirectories)
  const taskDirectoryName = createTaskDirectoryName(taskId, input.title)
  const taskSlug = extractSlugFromDirectoryName(taskDirectoryName)
  const template = await adapter.readTaskTemplate()
  const today = adapter.now()

  const frontmatter = taskFrontmatterSchema.parse({
    id: taskId,
    title: input.title,
    slug: taskSlug,
    type: input.type ?? 'feature',
    status: input.status ?? 'open',
    estimate: null,
    created: today,
    updated: today,
    milestone: input.milestone ?? null,
  })

  const taskMarkdown = renderTaskMarkdown(template, frontmatter, input.title)
  const taskFilePath = await adapter.writeTask(taskDirectoryName, taskMarkdown)

  return {
    taskId,
    taskDirectoryName,
    taskFilePath,
  }
}

export async function validateDocuments(
  adapter: TaskScriptAdapter,
  targets: string[]
): Promise<ValidationResult> {
  const documents = await adapter.loadTaskDocuments(targets)
  const errors: string[] = []
  const seenIds = new Map<string, string[]>()

  for (const document of documents) {
    try {
      validateDocument(document)

      // Track IDs for uniqueness check
      if (document.kind === 'task') {
        const frontmatter = taskFrontmatterSchema.parse(document.frontmatter)
        if (!seenIds.has(frontmatter.id)) {
          seenIds.set(frontmatter.id, [])
        }
        seenIds.get(frontmatter.id)!.push(document.path)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${document.path}: ${message}`)
    }
  }

  // Check for duplicate IDs
  for (const [id, paths] of seenIds) {
    if (paths.length > 1) {
      errors.push(`Duplicate task ID "${id}" found in: ${paths.join(', ')}`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export async function listTaskLines(
  adapter: TaskScriptAdapter,
  statusFilter?: ReadonlySet<TaskStatus> | null
): Promise<string> {
  const tree = await adapter.loadTaskTree()
  const filtered = filterTaskTree(tree, statusFilter ?? null)
  return renderTaskTree(filtered)
}

export function renderTaskMarkdown(
  template: string,
  frontmatter: ReturnType<typeof taskFrontmatterSchema.parse>,
  title: string
): string {
  return template
    .replace(/^---\r?\n[\s\S]*?\r?\n---/m, renderFrontmatter(frontmatter))
    .replace(/^# \[Task Title\]$/m, `# ${title}`)
    .replace(/<!--[\s\S]*?-->\r?\n?/g, '')
    .replace(/^- \[ \].*\]\(\.\/subtasks\/[^)\r\n]+\/SUBTASK\.md\)\r?\n?/gm, '')
}

export function validateDocument(document: TaskDocumentInput): void {
  if (document.kind === 'task') {
    const frontmatter = taskFrontmatterSchema.parse(document.frontmatter)
    const expectedSlug = extractTaskSlugFromFilePath(document.path)
    const expectedId = extractTaskIdFromFilePath(document.path)

    if (frontmatter.slug !== expectedSlug) {
      throw new Error(
        `Task slug mismatch for ${document.path}: expected ${JSON.stringify(expectedSlug)}, received ${JSON.stringify(frontmatter.slug)}`
      )
    }

    if (frontmatter.id !== expectedId) {
      throw new Error(
        `Task id mismatch for ${document.path}: expected ${JSON.stringify(expectedId)}, received ${JSON.stringify(frontmatter.id)}`
      )
    }

    return
  }

  subtaskFrontmatterSchema.parse(document.frontmatter)
}

export function filterTaskTree(
  nodes: TaskTreeNode[],
  filter: ReadonlySet<TaskStatus> | null
): TaskTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: filterTaskTree(node.children, filter),
    }))
    .filter(
      (node) =>
        filter === null || filter.has(node.status) || node.children.length > 0
    )
}

const getStatusMark = (status: TaskTreeNode['status']): string => {
  switch (status) {
    case 'cancelled':
    case 'completed':
      return 'x'
    case 'blocked':
      return '!'
    case 'in-progress':
      return '~'
    case 'open':
      return ' '
  }
}

export function renderTaskTree(nodes: TaskTreeNode[], depth = 0): string {
  return nodes
    .map((node) => {
      const indent = '  '.repeat(depth)
      const statusMark = getStatusMark(node.status)
      const checkbox = `[${statusMark}]`
      const line = `${indent}- ${checkbox} ${node.id} ${node.title}`
      const renderedChildren = renderTaskTree(node.children, depth + 1)

      return renderedChildren ? `${line}\n${renderedChildren}` : line
    })
    .join('\n')
}

export function renderFrontmatter(
  frontmatter: ReturnType<typeof taskFrontmatterSchema.parse>
): string {
  return [
    '---',
    `id: ${JSON.stringify(frontmatter.id)}`,
    `title: ${JSON.stringify(frontmatter.title)}`,
    `slug: ${JSON.stringify(frontmatter.slug)}`,
    `type: ${JSON.stringify(frontmatter.type)}`,
    `status: ${JSON.stringify(frontmatter.status)}`,
    `estimate: ${frontmatter.estimate == null ? 'null' : frontmatter.estimate}`,
    `milestone: ${frontmatter.milestone == null ? 'null' : JSON.stringify(frontmatter.milestone)}`,
    `created: ${JSON.stringify(frontmatter.created)}`,
    `updated: ${JSON.stringify(frontmatter.updated)}`,
    '---',
  ].join('\n')
}

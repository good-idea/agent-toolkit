import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  getSubtaskFilePathFromDirectory,
  getTaskFilePathFromDirectory,
  listSubtaskDirectories,
  listTaskDirectories,
  parseFrontmatter,
  sortByNumericPrefix,
  TASKS_ROOT,
  type SubtaskFrontmatter,
  type TaskFrontmatter,
} from './shared.js'
import type {
  TaskDocumentInput,
  TaskScriptAdapter,
  TaskTreeNode,
} from './ports.js'

const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'docs/tasks/000-template/TASK.md'
)

export const nodeTaskAdapter: TaskScriptAdapter = {
  now() {
    return new Date().toISOString().slice(0, 10)
  },

  async listTaskDirectories() {
    return listTaskDirectories()
  },

  allocateTaskId(existingTaskDirectories: string[]) {
    const nextId =
      existingTaskDirectories.reduce((maximum, directory) => {
        const match = /^(\d{3})-/.exec(path.basename(directory))
        if (!match) {
          return maximum
        }

        return Math.max(maximum, Number(match[1]))
      }, 0) + 1

    return String(nextId).padStart(3, '0')
  },

  async readTaskTemplate() {
    return readFile(TEMPLATE_PATH, 'utf8')
  },

  async writeTask(taskDirectoryName: string, taskMarkdown: string) {
    const taskDirectory = path.join(TASKS_ROOT, taskDirectoryName)
    const taskFilePath = getTaskFilePathFromDirectory(taskDirectory)

    await mkdir(taskDirectory, { recursive: true })
    await writeFile(taskFilePath, taskMarkdown, 'utf8')

    return taskFilePath
  },

  async loadTaskDocuments(targets: string[]) {
    const files = await resolveTaskFiles(targets)
    const documents: TaskDocumentInput[] = []

    for (const filePath of files) {
      const contents = await readFile(filePath, 'utf8')
      const { frontmatter, body } = parseFrontmatter(contents)
      const relativePath = path
        .relative(TASKS_ROOT, filePath)
        .split(path.sep)
        .join('/')

      if (relativePath.endsWith('/TASK.md')) {
        documents.push({ kind: 'task', path: relativePath, frontmatter, body })
        continue
      }

      if (relativePath.endsWith('/SUBTASK.md')) {
        documents.push({
          kind: 'subtask',
          path: relativePath,
          frontmatter,
          body,
        })
      }
    }

    return documents
  },

  async loadTaskTree() {
    const taskDirectories = sortByNumericPrefix(await listTaskDirectories())
    const nodes: TaskTreeNode[] = []

    for (const taskDirectory of taskDirectories) {
      const taskFilePath = getTaskFilePathFromDirectory(taskDirectory)
      const taskContents = await readFile(taskFilePath, 'utf8')
      const { frontmatter: taskFrontmatter } = parseFrontmatter(taskContents)
      const task = taskFrontmatter as TaskFrontmatter
      const children: TaskTreeNode[] = []

      const subtaskDirectories = sortByNumericPrefix(
        await listSubtaskDirectories(taskDirectory)
      )
      for (const subtaskDirectory of subtaskDirectories) {
        const subtaskFilePath =
          getSubtaskFilePathFromDirectory(subtaskDirectory)
        const subtaskContents = await readFile(subtaskFilePath, 'utf8')
        const { frontmatter: subtaskFrontmatter } =
          parseFrontmatter(subtaskContents)
        const subtask = subtaskFrontmatter as SubtaskFrontmatter

        children.push({
          id: `${task.id}-${subtask.id}`,
          title: subtask.title,
          status: subtask.status,
          children: [],
        })
      }

      nodes.push({
        id: task.id,
        title: task.title,
        status: task.status,
        children,
      })
    }

    return nodes
  },
}

async function resolveTaskFiles(targets: string[]): Promise<string[]> {
  if (targets.length === 0) {
    return collectAllTaskFiles()
  }

  const files: string[] = []

  for (const target of targets) {
    if (/^\d+$/.test(target)) {
      files.push(await resolveTaskFileById(target))
      continue
    }

    const absolutePath = path.resolve(process.cwd(), target)
    const targetStats = await stat(absolutePath)

    if (path.resolve(absolutePath) === path.resolve(TASKS_ROOT)) {
      files.push(...(await collectAllTaskFiles()))
      continue
    }

    if (targetStats.isDirectory()) {
      files.push(...(await collectTaskFilesInDirectory(absolutePath)))
    } else {
      files.push(absolutePath)
    }
  }

  return files
}

async function resolveTaskFileById(rawId: string): Promise<string> {
  const taskId = rawId.padStart(3, '0')
  const taskDirectories = await listTaskDirectories(TASKS_ROOT)
  const taskDirectory = taskDirectories.find((directory) =>
    path.basename(directory).startsWith(`${taskId}-`)
  )

  if (!taskDirectory) {
    throw new Error(`No task found with ID ${taskId}`)
  }

  return getTaskFilePathFromDirectory(taskDirectory)
}

async function collectAllTaskFiles(): Promise<string[]> {
  const directories = await listTaskDirectories()
  const files: string[] = []

  for (const directory of directories) {
    files.push(getTaskFilePathFromDirectory(directory))
    files.push(...(await collectSubtaskFiles(directory)))
  }

  return files
}

async function collectTaskFilesInDirectory(
  directory: string
): Promise<string[]> {
  const taskFile = getTaskFilePathFromDirectory(directory)
  const subtaskFile = getSubtaskFilePathFromDirectory(directory)

  if (await fileExists(taskFile)) {
    return [taskFile, ...(await collectSubtaskFiles(directory))]
  }

  if (await fileExists(subtaskFile)) {
    return [subtaskFile]
  }

  return []
}

async function collectSubtaskFiles(taskDirectory: string): Promise<string[]> {
  const subtaskDirectories = await listSubtaskDirectories(taskDirectory)
  return subtaskDirectories.map((directory) =>
    getSubtaskFilePathFromDirectory(directory)
  )
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

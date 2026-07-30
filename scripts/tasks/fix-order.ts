import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { nodeTaskAdapter } from './node-adapter.js'
import {
  listTaskDirectories,
  sortByNumericPrefix,
  extractSlugFromDirectoryName,
  parseFrontmatter,
  taskFrontmatterSchema,
} from './shared.js'
import { renderFrontmatter } from './app.js'
import { readFile, writeFile, rename } from 'node:fs/promises'

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`fix-order failed: ${message}`)
    process.exitCode = 1
  })
}

export async function main(): Promise<void> {
  const taskDirectories = await listTaskDirectories()
  const sortedDirs = sortByNumericPrefix(taskDirectories)

  // Load all tasks and track duplicate IDs
  interface TaskInfo {
    directory: string
    id: string
    slug: string
    frontmatter: Record<string, unknown>
    content: string
  }

  const tasks: TaskInfo[] = []
  const idToTasks = new Map<string, TaskInfo[]>()

  for (const dir of sortedDirs) {
    const taskFilePath = path.join(dir, 'TASK.md')
    const content = await readFile(taskFilePath, 'utf8')
    const { frontmatter } = parseFrontmatter(content)
    const parsed = taskFrontmatterSchema.parse(frontmatter)

    const task: TaskInfo = {
      directory: dir,
      id: parsed.id,
      slug: parsed.slug,
      frontmatter,
      content,
    }

    tasks.push(task)

    if (!idToTasks.has(parsed.id)) {
      idToTasks.set(parsed.id, [])
    }
    idToTasks.get(parsed.id)!.push(task)
  }

  // Find duplicates and fix them
  let hasChanges = false
  const usedIds = new Set<number>()

  for (const task of tasks) {
    usedIds.add(Number(task.id))
  }

  for (const [id, duplicateTasks] of idToTasks) {
    if (duplicateTasks.length > 1) {
      hasChanges = true
      console.log(
        `Found duplicate ID "${id}" in ${duplicateTasks.length} tasks:`
      )

      // Keep the first one, reassign the rest
      for (let i = 1; i < duplicateTasks.length; i++) {
        const task = duplicateTasks[i]
        let newId = Math.max(...usedIds) + 1

        // Find the next available ID
        while (usedIds.has(newId)) {
          newId++
        }

        usedIds.add(newId)
        const newIdStr = String(newId).padStart(3, '0')

        console.log(
          `  - Reassigning "${task.id}" in ${task.directory} → "${newIdStr}"`
        )

        // Update frontmatter
        const updated = { ...task.frontmatter, id: newIdStr }
        const newFrontmatter = renderFrontmatter(
          taskFrontmatterSchema.parse(updated)
        )

        // Replace frontmatter in content
        const newContent = task.content.replace(
          /^---\r?\n[\s\S]*?\r?\n---/m,
          newFrontmatter
        )

        // Write back
        const taskFilePath = path.join(task.directory, 'TASK.md')
        await writeFile(taskFilePath, newContent, 'utf8')

        // Rename directory
        const oldDirName = path.basename(task.directory)
        const newDirName = `${newIdStr}-${task.slug}`
        const newDirPath = path.join(path.dirname(task.directory), newDirName)
        await rename(task.directory, newDirPath)
        console.log(`    Directory: ${oldDirName} → ${newDirName}`)
      }
    }
  }

  if (!hasChanges) {
    console.log('No duplicate task IDs found. All tasks have unique IDs.')
    return
  }

  console.log('\nTask IDs have been fixed. Run task:validate-all to verify.')
}

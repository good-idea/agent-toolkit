import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { renderFrontmatter } from './app.js'
import {
  getTaskFilePathFromDirectory,
  listTaskDirectories,
  parseFrontmatter,
  TASKS_ROOT,
  taskFrontmatterSchema,
  taskScriptArgs,
} from './shared.js'

const { values, positionals } = parseArgs({
  args: taskScriptArgs(),
  options: {
    status: { type: 'string' },
    type: { type: 'string' },
    milestone: { type: 'string' },
    title: { type: 'string' },
    estimate: { type: 'string' },
  },
  allowPositionals: true,
})

async function main() {
  const rawId = positionals[0]

  if (!rawId) {
    throw new Error(
      'A task number is required. Example: pnpm task:update -- 006 --status=in-progress'
    )
  }

  const taskId = rawId.padStart(3, '0')

  const taskDirectories = await listTaskDirectories(TASKS_ROOT)
  const taskDirectory = taskDirectories.find((dir) =>
    path.basename(dir).startsWith(`${taskId}-`)
  )

  if (!taskDirectory) {
    throw new Error(`No task found with ID ${taskId}`)
  }

  const taskFilePath = getTaskFilePathFromDirectory(taskDirectory)
  const contents = await readFile(taskFilePath, 'utf8')
  const { frontmatter: rawFrontmatter, body } = parseFrontmatter(contents)

  const today = new Date().toISOString().slice(0, 10)
  const updates: Record<string, unknown> = { updated: today }

  if (values.status !== undefined) updates.status = values.status
  if (values.type !== undefined) updates.type = values.type
  if (values.milestone !== undefined)
    updates.milestone = values.milestone === 'null' ? null : values.milestone
  if (values.title !== undefined) updates.title = values.title
  if (values.estimate !== undefined)
    updates.estimate = values.estimate === 'null' ? null : values.estimate

  const merged = { ...rawFrontmatter, ...updates }
  const frontmatter = taskFrontmatterSchema.parse(merged)

  const newContents = renderFrontmatter(frontmatter) + '\n' + body
  await writeFile(taskFilePath, newContents, 'utf8')
  execFileSync(
    'pnpm',
    ['exec', 'prettier', '--write', taskFilePath, '--log-level', 'silent'],
    {
      stdio: 'inherit',
    }
  )

  const updatedFields = Object.keys(updates).join(', ')
  console.log(`Updated task ${taskId}: ${updatedFields}`)
  console.log(`  ${path.relative(process.cwd(), taskFilePath)}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`task:update failed: ${message}`)
  process.exitCode = 1
})

import path from 'node:path'
import { parseArgs } from 'node:util'
import { createTask } from './app.js'
import { nodeTaskAdapter } from './node-adapter.js'
import { taskScriptArgs, type TaskFrontmatter } from './shared.js'

const { values, positionals } = parseArgs({
  args: taskScriptArgs(),
  options: {
    id: { type: 'string' },
    type: { type: 'string' },
    status: { type: 'string' },
    milestone: { type: 'string' },
  },
  allowPositionals: true,
})

const title = positionals.join(' ').trim()

async function main() {
  if (!title) {
    throw new Error(
      'A task title is required. Example: pnpm task:create -- "Add task scripts"'
    )
  }

  const result = await createTask(nodeTaskAdapter, {
    id: values.id,
    title,
    type: values.type as TaskFrontmatter['type'] | undefined,
    status: values.status as TaskFrontmatter['status'] | undefined,
    milestone: values.milestone ?? null,
  })

  console.log(
    `Created ${path.relative(process.cwd(), path.join('docs/tasks', result.taskDirectoryName))}`
  )
  console.log(`  ${path.relative(process.cwd(), result.taskFilePath)}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`task:create failed: ${message}`)
  process.exitCode = 1
})

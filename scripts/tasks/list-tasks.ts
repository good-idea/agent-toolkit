import { parseArgs } from 'node:util'
import { listTaskLines } from './app.js'
import { nodeTaskAdapter } from './node-adapter.js'
import { parseStatusFilter, taskScriptArgs } from './shared.js'

const { values } = parseArgs({
  args: taskScriptArgs(),
  options: {
    status: { type: 'string' },
  },
})

const statusFilter = parseStatusFilter(values.status)

async function main() {
  const output = await listTaskLines(nodeTaskAdapter, statusFilter)

  if (!output.trim()) {
    console.log('(no tasks found)')
    return
  }

  console.log(output)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`task:list failed: ${message}`)
  process.exitCode = 1
})

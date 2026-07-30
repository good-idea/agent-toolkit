import path from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { validateDocuments } from './app.js'
import { taskScriptArgs } from './shared.js'
import { nodeTaskAdapter } from './node-adapter.js'

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false

if (isDirectExecution) {
  const { positionals } = parseArgs({
    args: taskScriptArgs(),
    allowPositionals: true,
  })

  main(positionals).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`task:validate failed: ${message}`)
    process.exitCode = 1
  })
}

export async function main(positionals: string[]): Promise<void> {
  const result = await validateDocuments(nodeTaskAdapter, positionals)

  if (result.ok) {
    const documents = await nodeTaskAdapter.loadTaskDocuments(positionals)
    for (const document of documents) {
      console.log(`OK ${document.path}`)
    }
    return
  }

  console.error('Validation failed:')
  for (const error of result.errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
}

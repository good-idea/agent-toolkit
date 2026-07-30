import { validateDocuments } from './app.js'
import { nodeTaskAdapter } from './node-adapter.js'
import { TASKS_ROOT } from './shared.js'

validateDocuments(nodeTaskAdapter, [TASKS_ROOT])
  .then((result) => {
    if (result.ok) {
      console.log(`OK ${TASKS_ROOT}`)
      return
    }

    console.error('Validation failed:')
    for (const error of result.errors) {
      console.error(`- ${error}`)
    }
    process.exitCode = 1
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`task:validate-all failed: ${message}`)
    process.exitCode = 1
  })

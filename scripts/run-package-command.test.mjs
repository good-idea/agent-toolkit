import assert from 'node:assert/strict'
import test from 'node:test'

import { runPackageCommand } from './run-package-command.mjs'

function runWithStatuses(statuses) {
  const calls = []
  const logs = []
  const statusQueue = [...statuses]

  const exitCode = runPackageCommand({
    scriptName: 'test',
    packages: ['app'],
    run: (command, args) => {
      calls.push({ command, args })
      return { status: statusQueue.shift() }
    },
    log: (message) => logs.push(message),
  })

  return { calls, exitCode, logs }
}

test('runs the package and succeeds when the command passes', () => {
  const result = runWithStatuses([0])

  assert.equal(result.calls.length, 1)
  assert.deepEqual(result.calls[0].args.slice(0, 2), ['--dir', 'app'])
  assert.equal(result.exitCode, 0)
  assert.match(result.logs.at(-1), /Passed test: app/)
})

test('reports a failure when the command fails', () => {
  const result = runWithStatuses([1])

  assert.equal(result.calls.length, 1)
  assert.equal(result.exitCode, 1)
  assert.match(result.logs.at(-1), /Failed test: app/)
})

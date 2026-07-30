import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Customize this list to match your workspace packages.
// For a single-package project you may not need this script at all.
const defaultPackages = ['app']

export function runPackageCommand({
  scriptName,
  packages = defaultPackages,
  run = spawnSync,
  log = console.log,
}) {
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const failures = []

  for (const packageName of packages) {
    log(`\n=== ${packageName}: ${scriptName} ===`)

    const result = run(
      pnpmCommand,
      ['--dir', packageName, 'run', '--if-present', scriptName],
      { stdio: 'inherit' }
    )

    if (result.status !== 0) failures.push(packageName)
  }

  if (failures.length > 0) {
    log(`\nFailed ${scriptName}: ${failures.join(', ')}`)
    return 1
  }

  log(`\nPassed ${scriptName}: ${packages.join(', ')}`)
  return 0
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const scriptName = process.argv[2]

  if (!scriptName) {
    console.error('Usage: node scripts/run-package-command.mjs <script-name>')
    process.exitCode = 1
  } else {
    process.exitCode = runPackageCommand({ scriptName })
  }
}

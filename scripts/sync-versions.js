#!/usr/bin/env node

/**
 * Sync version across all package.json files and Helm Chart.yaml
 * Usage: node scripts/sync-versions.js <version>
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const version = process.argv[2]

if (!version) {
  console.error('Usage: node scripts/sync-versions.js <version>')
  process.exit(1)
}

console.log(`Syncing version to: ${version}`)

// Files to update
const files = [
  {
    path: join(rootDir, 'package.json'),
    type: 'json',
    field: 'version'
  },
  {
    path: join(rootDir, 'backend', 'package.json'),
    type: 'json',
    field: 'version'
  },
  {
    path: join(rootDir, 'helm', 'Chart.yaml'),
    type: 'yaml',
    fields: ['version', 'appVersion']
  }
]

for (const file of files) {
  try {
    const content = readFileSync(file.path, 'utf8')

    if (file.type === 'json') {
      const json = JSON.parse(content)
      json[file.field] = version
      writeFileSync(file.path, JSON.stringify(json, null, 2) + '\n')
      console.log(`✓ Updated ${file.path}`)
    } else if (file.type === 'yaml') {
      let updated = content
      for (const field of file.fields) {
        // Handle both quoted and unquoted values
        updated = updated.replace(
          new RegExp(`^(${field}:\\s*)["']?[^"'\\n]+["']?`, 'm'),
          `$1"${version}"`
        )
      }
      writeFileSync(file.path, updated)
      console.log(`✓ Updated ${file.path}`)
    }
  } catch (error) {
    console.error(`✗ Failed to update ${file.path}: ${error.message}`)
    process.exit(1)
  }
}

console.log(`\n✓ All files synced to version ${version}`)

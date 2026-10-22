// One-off helper used during the Vue → React migration to lift the static hub
// content out of the original single file components into typed data modules.
// Run with: node scripts/extract-hub-content.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'src', 'views')
const outDir = join(root, 'client', 'src', 'data', 'hubs')

const hubs = [
  { file: 'CampusNewsPage.vue', name: 'campusNews' },
  { file: 'AspirantPage.vue', name: 'aspirant' },
  { file: 'SiwesPage.vue', name: 'siwes' },
  { file: 'AcademicHubPage.vue', name: 'academic' },
  { file: 'FinalYearPage.vue', name: 'finalYear' },
]

/** Extracts a top-level `const <name> = [ ... ]` literal from a Vue SFC. */
function extractArray(source, name) {
  const marker = `const ${name} = [`
  const start = source.indexOf(marker)
  if (start === -1) throw new Error(`Could not find "${name}"`)

  let depth = 0
  let index = start + marker.length - 1
  for (; index < source.length; index += 1) {
    const char = source[index]
    if (char === '[') depth += 1
    else if (char === ']') {
      depth -= 1
      if (depth === 0) break
    }
  }

  const literal = source.slice(start + marker.length - 1, index + 1)
  // The literal is valid JSON-ish JS; evaluate it in a sandboxed function.
  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal}`)()
}

mkdirSync(outDir, { recursive: true })

for (const hub of hubs) {
  const source = readFileSync(join(sourceDir, hub.file), 'utf8')
  const categories = extractArray(source, 'categories')
  const body = `// Extracted from the original ${hub.file} during the Vue → React migration.
// The content is unchanged; only the surrounding UI moved into React components.

import type { HubCategory } from './shared'

export const ${hub.name}Categories: HubCategory[] = ${JSON.stringify(categories, null, 2)}
`
  writeFileSync(join(outDir, `${hub.name}.ts`), body, 'utf8')
  console.log(`Wrote ${hub.name}.ts (${categories.length} categories)`)
}

/**
 * Phase 1 content normalization script.
 * Run once: bun run scripts/normalize-content.ts
 *
 * 1. Adds category/type/status/featured to each project .md frontmatter
 * 2. Regenerates public/projects/index.json with all fields (incl. summary)
 * 3. Adds featured:false to every entry in public/writing/index.json
 * 4. Adds platform/status/featured to public/toolbox/index.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

// ── 1. Project .md frontmatter additions ────────────────────────────────────

const PROJECT_META: Record<string, { category: string; type: string; status: string; featured: boolean }> = {
  'H-T8.md':          { category: 'web',            type: 'community', status: 'complete', featured: true  },
  'Secure_Network.md':{ category: 'security',        type: 'personal',  status: 'active',   featured: true  },
  'TCP_Server.md':    { category: 'infrastructure',  type: 'personal',  status: 'complete', featured: false },
  'docker.md':        { category: 'security',        type: 'academic',  status: 'complete', featured: false },
  'portfolio.md':     { category: 'web',             type: 'personal',  status: 'archived', featured: false },
  'testomonster.md':  { category: 'security',        type: 'academic',  status: 'complete', featured: false },
}

for (const [filename, fields] of Object.entries(PROJECT_META)) {
  const path = join('public/projects', filename)
  let content = readFileSync(path, 'utf-8')

  // Only insert if not already present
  if (!content.includes('category:')) {
    const insertion = `category: ${fields.category}\ntype: ${fields.type}\nstatus: ${fields.status}\nfeatured: ${fields.featured}\n`
    content = content.replace('--->', `${insertion}--->`)
    writeFileSync(path, content, 'utf-8')
    console.log(`✓ Updated frontmatter: ${filename}`)
  } else {
    console.log(`  Skipped (already has category): ${filename}`)
  }
}

// ── 2. Regenerate public/projects/index.json ────────────────────────────────

function parseFrontmatter(raw: string): Record<string, string | string[]> {
  const match =
    raw.match(/<!--- metadata\s*\n([\s\S]*?)\n\s*--->/) ??
    raw.match(/<!--- metadata\n([\s\S]*?)\n--->/)

  if (!match) return {}

  const metadata: Record<string, string | string[]> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue
    const colonIdx = trimmed.indexOf(':')
    const key = trimmed.substring(0, colonIdx).trim()
    const value = trimmed.substring(colonIdx + 1).trim()
    if (!key) continue
    if (value.startsWith('[') && value.endsWith(']')) {
      try { metadata[key] = JSON.parse(value) } catch { metadata[key] = value }
    } else {
      metadata[key] = value
    }
  }
  return metadata
}

const projectFiles = readdirSync('public/projects').filter(f => f.endsWith('.md'))

const projects = projectFiles.map(file => {
  const raw = readFileSync(join('public/projects', file), 'utf-8')
  const m = parseFrontmatter(raw)
  const get = (k: string) => (typeof m[k] === 'string' ? m[k] as string : '')
  return {
    id:       get('id'),
    slug:     file.replace('.md', ''),
    title:    get('title'),
    subtitle: get('subtitle'),
    summary:  get('summary'),
    date:     get('date'),
    url:      get('url'),
    image:    get('image'),
    imageAlt: get('imageAlt'),
    tags:     Array.isArray(m.tags) ? m.tags as string[] : [],
    category: get('category'),
    type:     get('type'),
    status:   get('status'),
    featured: get('featured') === 'true',
  }
}).filter(p => p.id)

// Sort by date descending (DD.MM.YYYY)
projects.sort((a, b) => {
  const toMs = (d: string) => {
    const [dd, mm, yyyy] = d.split('.')
    return new Date(`${yyyy}-${mm}-${dd}`).getTime()
  }
  return toMs(b.date) - toMs(a.date)
})

writeFileSync('public/projects/index.json', JSON.stringify(projects, null, 2), 'utf-8')
console.log(`✓ Regenerated public/projects/index.json (${projects.length} entries)`)

// ── 3. Add featured to public/writing/index.json ────────────────────────────

const writingRaw = readFileSync('public/writing/index.json', 'utf-8')
const writingEntries = JSON.parse(writingRaw) as Record<string, unknown>[]

const writingUpdated = writingEntries.map(entry =>
  'featured' in entry ? entry : { ...entry, featured: false }
)

writeFileSync('public/writing/index.json', JSON.stringify(writingUpdated, null, 2), 'utf-8')
console.log(`✓ Updated public/writing/index.json (${writingUpdated.length} entries)`)

// ── 4. Update public/toolbox/index.json ─────────────────────────────────────

const toolboxRaw = readFileSync('public/toolbox/index.json', 'utf-8')
const tools = JSON.parse(toolboxRaw) as Record<string, unknown>[]

const toolsUpdated = tools.map(tool => ({
  ...tool,
  platform: (tool.platform as string | undefined) ?? 'web',
  status:   (tool.status   as string | undefined) ?? 'active',
  featured: (tool.featured as boolean | undefined) ?? false,
}))

writeFileSync('public/toolbox/index.json', JSON.stringify(toolsUpdated, null, 2), 'utf-8')
console.log(`✓ Updated public/toolbox/index.json (${toolsUpdated.length} tools)`)

console.log('\nDone.')

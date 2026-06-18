export type FrontmatterValue = string | string[] | Array<Record<string, unknown>>

export interface Frontmatter {
  [key: string]: FrontmatterValue
}

export interface ParsedContent {
  metadata: Frontmatter
  content: string
}

/**
 * Parses the custom <!--- metadata ... ---> frontmatter block used in .md files.
 * This format is also parsed by the GitHub Actions auto-generation workflows —
 * do NOT change the format in the .md files themselves.
 *
 * Ported from _old_src/modules/diaryViewer.js :: extractFrontmatter()
 */
export function parseFrontmatter(raw: string): ParsedContent {
  // Try multiple patterns to handle minor formatting variations
  let fmMatch =
    raw.match(/<!--- metadata\s*\n([\s\S]*?)\n\s*--->/) ??
    raw.match(/<!--- metadata\n([\s\S]*?)\n--->/) ??
    raw.match(/<!--\s*metadata\s*\n([\s\S]*?)\n\s*-->/)

  if (!fmMatch) {
    return { metadata: {}, content: raw }
  }

  const rawBlock = fmMatch[1]
  const content = raw.replace(fmMatch[0], '').trim()

  const lines = rawBlock.split(/\r?\n/)
  const metadata: Frontmatter = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue

    const colonIdx = trimmed.indexOf(':')
    const key = trimmed.substring(0, colonIdx).trim()
    const value = trimmed.substring(colonIdx + 1).trim()

    if (!key) continue

    // JSON arrays (e.g. tags: ["a", "b"])
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        metadata[key] = JSON.parse(value) as string[]
      } catch {
        metadata[key] = value
      }
    } else {
      metadata[key] = value
    }
  }

  return { metadata, content }
}

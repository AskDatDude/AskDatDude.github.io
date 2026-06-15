import type { FrontmatterValue } from "./frontmatter";
import { calculateReadingTime } from "./readingTime";

export function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_\-\s]{1,100}$/.test(slug);
}

export function getString(value: FrontmatterValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export function getStringArray(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  const stringValue = getString(value);
  return stringValue ? [stringValue] : [];
}

export async function fetchReadingTimes(
  entries: Array<{ slug: string; summary?: string }>,
  signal: AbortSignal,
): Promise<Record<string, number>> {
  const pairs = await Promise.all(
    entries.map(async (entry) => {
      try {
        const response = await fetch(`/writing/entries/${entry.slug}.md`, {
          signal,
        });
        const content = response.ok
          ? await response.text()
          : entry.summary || "";
        return [entry.slug, calculateReadingTime(content)] as const;
      } catch {
        return [entry.slug, calculateReadingTime(entry.summary || "")] as const;
      }
    }),
  );
  return Object.fromEntries(pairs);
}

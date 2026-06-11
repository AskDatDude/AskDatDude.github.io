const WORDS_PER_MINUTE = 150;

export function calculateReadingTime(content: string): number {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

export function formatReadingTime(minutes: number): string {
  return `~${minutes} min read`;
}

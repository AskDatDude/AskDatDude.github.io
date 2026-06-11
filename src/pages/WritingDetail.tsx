import { useEffect, useState } from "preact/hooks";
import { BackToTop } from "../components/common/BackToTop";
import { ReadingLayout } from "../components/reading/ReadingLayout";
import { parseFrontmatter, type Frontmatter } from "../utils/frontmatter";
import {
  extractTableOfContents,
  renderMarkdown,
  type TableOfContentsItem,
} from "../utils/markdown";
import {
  calculateReadingTime,
  formatReadingTime,
} from "../utils/readingTime";
import "./WritingDetail.css";

type WritingDetailProps = {
  slug?: string;
};

type WritingContent = {
  metadata: Frontmatter;
  html: string;
  readingTime: number;
  tableOfContents: TableOfContentsItem[];
};

export function WritingDetail({ slug }: WritingDetailProps) {
  const [entry, setEntry] = useState<WritingContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const entrySlug = slug?.trim();

    if (!entrySlug) {
      setError("Writing entry slug missing.");
      setEntry(null);
      return () => controller.abort();
    }

    if (!isValidSlug(entrySlug)) {
      setError("Invalid writing entry slug.");
      setEntry(null);
      return () => controller.abort();
    }

    (async () => {
      try {
        setError(null);
        const res = await fetch(`/writing/entries/${entrySlug}.md`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Writing entry not found."
              : "Failed to load writing entry.",
          );
        }
        const raw = await res.text();
        const { metadata, content } = parseFrontmatter(raw);
        const html = renderMarkdown(content, {
          assetBasePath: "/writing/entries/",
        });
        const tableOfContents = extractTableOfContents(content, {
          assetBasePath: "/writing/entries/",
        });
        setEntry({
          metadata,
          html,
          readingTime: calculateReadingTime(raw),
          tableOfContents,
        });

        const title =
          typeof metadata.title === "string" ? metadata.title : "Writing";
        document.title = `${title} - Robin Niinemets`;
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(
          e instanceof Error ? e.message : "Failed to load writing entry.",
        );
        setEntry(null);
      }
    })();

    return () => controller.abort();
  }, [slug]);

  const metadata = entry?.metadata;
  const title = getString(metadata?.title) || slug || "Writing";
  const date = getString(metadata?.date);
  const week = getString(metadata?.week);

  return (
    <main class="writing-detail-page">
      {error ? (
        <div class="reading-status">
          <p class="project-error">{error}</p>
        </div>
      ) : !entry ? (
        <div class="reading-status">
          <p class="paragraph">Loading writing entry…</p>
        </div>
      ) : (
        <>
          <header class="writing-entry-header">
            <h1 class="writing-entry-title">{title}</h1>
            {(date || week || entry.readingTime) && (
              <div class="writing-entry-metadata">
                {date && <p>{date}</p>}
                {week && <p>{week}</p>}
                <p>{formatReadingTime(entry.readingTime)}</p>
              </div>
            )}
            <div class="line" />
          </header>
          <ReadingLayout
            backHref="/writing"
            backLabel="All writing"
            tableOfContents={entry.tableOfContents}
            html={entry.html}
          />
        </>
      )}
      <BackToTop variant="diary" />
    </main>
  );
}

function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  const validPattern = /^[a-zA-Z0-9_\-\s]+$/;
  const dangerousPatterns = [
    "./",
    "../",
    "..\\",
    ".\\",
    ":",
    "<",
    ">",
    "|",
    "\"",
    "*",
    "?",
  ];
  return (
    validPattern.test(slug) &&
    !dangerousPatterns.some((pattern) => slug.includes(pattern)) &&
    slug.length <= 100
  );
}

function getString(value: Frontmatter[keyof Frontmatter] | undefined): string {
  return typeof value === "string" ? value : "";
}

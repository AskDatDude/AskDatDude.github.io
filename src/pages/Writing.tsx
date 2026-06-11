import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";
import {
  calculateReadingTime,
  formatReadingTime,
} from "../utils/readingTime";

type WritingIndexItem = {
  title: string;
  date?: string;
  slug: string;
  id?: string;
  week?: string;
  summary?: string;
  tags?: string[];
  featured?: boolean;
};

type TagCount = {
  tag: string;
  count: number;
};

const ALL_TAG = "all";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

export function Writing() {
  const [entries, setEntries] = useState<WritingIndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>(ALL_TAG);
  const [query, setQuery] = useState("");
  const [readTimes, setReadTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        const data = await fetchJson<WritingIndexItem[]>(
          "/writing/index.json",
          controller.signal,
        );
        const sorted = [...data].sort(
          (a, b) => parseFlexibleDate(b.date) - parseFlexibleDate(a.date),
        );
        setEntries(sorted);

        const times = await fetchReadTimes(sorted, controller.signal);
        if (controller.signal.aborted) return;
        setReadTimes(times);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load writing");
        setEntries([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const tagCounts = useMemo<TagCount[]>(() => {
    if (!entries) return [];
    const counts = new Map<string, number>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!entries) return null;
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesTag =
        activeTag === ALL_TAG || entry.tags?.includes(activeTag);
      const matchesQuery =
        !needle ||
        [
          entry.title,
          entry.summary,
          entry.date,
          entry.id,
          entry.week,
          ...(entry.tags || []),
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));

      return matchesTag && matchesQuery;
    });
  }, [entries, activeTag, query]);

  return (
    <PageWrapper>
      <section class="script-section">
        <div class="h2">Reports</div>
        <div class="h1-caps">Writing</div>
        <p class="paragraph">
          Course reports, security notes, and technical writeups from hands-on
          lab work.
        </p>
      </section>

      <div class="line" />
      <div class="space-50" />

      <div class="search-wrapper">
        <label class="h2" for="writing-search">
          Search writing
        </label>
        <input
          id="writing-search"
          type="search"
          value={query}
          placeholder="Search by title, course, tag, or summary"
          onInput={(event) =>
            setQuery((event.currentTarget as HTMLInputElement).value)
          }
        />
      </div>

      {entries && tagCounts.length > 0 && (
        <div class="tag-buttons" aria-label="Filter writing by tag">
          <button
            type="button"
            class={`tag-button ${activeTag === ALL_TAG ? "active" : ""}`}
            aria-pressed={activeTag === ALL_TAG}
            onClick={() => setActiveTag(ALL_TAG)}
          >
            All writing ({entries.length})
          </button>
          {tagCounts.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              class={`tag-button ${activeTag === tag ? "active" : ""}`}
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      )}

      <div class="space-50" />

      <section class="script-section">
        {error ? (
          <p class="project-error">Error loading writing data: {error}</p>
        ) : !filteredEntries ? (
          <p class="paragraph">Loading writing…</p>
        ) : filteredEntries.length === 0 ? (
          <p class="paragraph">No writing found.</p>
        ) : (
          <div id="writing-cards">
            {filteredEntries.map((entry) => (
              <Card key={entry.slug} href={`/writing/${entry.slug}`} variant="list">
                <div class="header">
                  {entry.date && <div class="h3">{entry.date}</div>}
                  {entry.id && <div class="h3">{entry.id}</div>}
                </div>

                <div class="content">
                  <div class="medium-card-header">{entry.title}</div>
                  {entry.week && <div class="h3">{entry.week}</div>}
                  {entry.summary && <p class="paragraph">{entry.summary}</p>}
                </div>

                <div class="space-50" />

                <div class="container">
                  {!!entry.tags?.length && (
                    <div class="tags">
                      {entry.tags.map((tag) => (
                        <Tag key={tag} label={tag} />
                      ))}
                    </div>
                  )}
                  <div class="read-time">
                    {formatReadingTime(readTimes[entry.slug] || 1)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}

function parseFlexibleDate(date: string | undefined): number {
  if (!date) return 0;

  if (date.includes(".")) {
    const [day, month, year] = date.split(".").map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day).getTime();
    }
  }

  const parsed = new Date(date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function fetchReadTimes(
  entries: WritingIndexItem[],
  signal: AbortSignal,
): Promise<Record<string, number>> {
  const pairs = await Promise.all(
    entries.map(async (entry) => {
      try {
        const res = await fetch(`/writing/entries/${entry.slug}.md`, {
          signal,
        });
        const content = res.ok ? await res.text() : entry.summary || "";
        return [entry.slug, calculateReadingTime(content)] as const;
      } catch {
        return [
          entry.slug,
          calculateReadingTime(entry.summary || ""),
        ] as const;
      }
    }),
  );

  return Object.fromEntries(pairs);
}

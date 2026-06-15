import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import { calculateReadingTime, formatReadingTime } from "../utils/readingTime";
import "./Writing.css";

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

type FacetOption = {
  value: string;
  count: number;
};

type FacetField = "course" | "year" | "length";
type SortOption = "newest" | "oldest" | "title" | "shortest" | "longest";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

function parseFlexibleDate(date: string | undefined): number {
  if (!date) return 0;
  if (date.includes(".")) {
    const [day, month, year] = date.split(".").map(Number);
    if (day && month && year) return new Date(year, month - 1, day).getTime();
  }
  const parsed = new Date(date).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getYear(entry: WritingIndexItem): string {
  const year = entry.date?.match(/\d{4}/)?.[0];
  return year || "Unknown";
}

function getCourse(entry: WritingIndexItem): string {
  return (
    entry.tags?.find((tag) => !/^[A-Z]{3}\d/i.test(tag)) || entry.id || "Other"
  );
}

function getLength(minutes: number): string {
  if (minutes <= 5) return "Short";
  if (minutes <= 10) return "Medium";
  return "Long";
}

function getInitialValues(key: string): string[] {
  if (typeof window === "undefined") return [];
  return (
    new URLSearchParams(window.location.search)
      .get(key)
      ?.split(",")
      .filter(Boolean) ?? []
  );
}

function getInitialSort(): SortOption {
  if (typeof window === "undefined") return "newest";
  const sort = new URLSearchParams(window.location.search).get("sort");
  return sort === "oldest" ||
    sort === "title" ||
    sort === "shortest" ||
    sort === "longest"
    ? sort
    : "newest";
}

function getFacetValue(
  entry: WritingIndexItem,
  field: FacetField,
  readTimes: Record<string, number>,
): string {
  if (field === "course") return getCourse(entry);
  if (field === "year") return getYear(entry);
  return getLength(readTimes[entry.slug] || 1);
}

function buildFacet(
  entries: WritingIndexItem[],
  eligibleEntries: WritingIndexItem[],
  field: FacetField,
  readTimes: Record<string, number>,
): FacetOption[] {
  const values = new Set(
    entries.map((entry) => getFacetValue(entry, field, readTimes)),
  );
  const counts = new Map<string, number>();
  eligibleEntries.forEach((entry) => {
    const value = getFacetValue(entry, field, readTimes);
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(values, (value) => ({
    value,
    count: counts.get(value) || 0,
  })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function matchesSearch(entry: WritingIndexItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    entry.title,
    entry.summary,
    entry.date,
    entry.id,
    entry.week,
    ...(entry.tags || []),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

export function Writing() {
  const [entries, setEntries] = useState<WritingIndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") || "";
  });
  const [sort, setSort] = useState<SortOption>(getInitialSort);
  const [courses, setCourses] = useState<string[]>(() =>
    getInitialValues("course"),
  );
  const [years, setYears] = useState<string[]>(() => getInitialValues("year"));
  const [lengths, setLengths] = useState<string[]>(() =>
    getInitialValues("length"),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
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
        setEntries(data);
        const times = await fetchReadTimes(data, controller.signal);
        if (!controller.signal.aborted) setReadTimes(times);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load writing",
        );
        setEntries([]);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (courses.length) params.set("course", courses.join(","));
    if (years.length) params.set("year", years.join(","));
    if (lengths.length) params.set("length", lengths.join(","));
    if (sort !== "newest") params.set("sort", sort);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [query, courses, years, lengths, sort]);

  const matchesOtherFacets = (
    entry: WritingIndexItem,
    excludedField?: FacetField,
  ) =>
    matchesSearch(entry, query) &&
    (excludedField === "course" ||
      !courses.length ||
      courses.includes(getCourse(entry))) &&
    (excludedField === "year" ||
      !years.length ||
      years.includes(getYear(entry))) &&
    (excludedField === "length" ||
      !lengths.length ||
      lengths.includes(getLength(readTimes[entry.slug] || 1)));

  const courseOptions = useMemo(
    () =>
      buildFacet(
        entries || [],
        (entries || []).filter((entry) => matchesOtherFacets(entry, "course")),
        "course",
        readTimes,
      ),
    [entries, query, years, lengths, readTimes],
  );
  const yearOptions = useMemo(
    () =>
      buildFacet(
        entries || [],
        (entries || []).filter((entry) => matchesOtherFacets(entry, "year")),
        "year",
        readTimes,
      ),
    [entries, query, courses, lengths, readTimes],
  );
  const lengthOptions = useMemo(
    () =>
      buildFacet(
        entries || [],
        (entries || []).filter((entry) => matchesOtherFacets(entry, "length")),
        "length",
        readTimes,
      ),
    [entries, query, courses, years, readTimes],
  );

  const filteredEntries = useMemo(() => {
    if (!entries) return null;
    return entries
      .filter((entry) => matchesOtherFacets(entry))
      .sort((a, b) => {
        if (sort === "oldest")
          return parseFlexibleDate(a.date) - parseFlexibleDate(b.date);
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "shortest")
          return (readTimes[a.slug] || 1) - (readTimes[b.slug] || 1);
        if (sort === "longest")
          return (readTimes[b.slug] || 1) - (readTimes[a.slug] || 1);
        return parseFlexibleDate(b.date) - parseFlexibleDate(a.date);
      });
  }, [entries, query, courses, years, lengths, sort, readTimes]);

  const activeFilterCount = courses.length + years.length + lengths.length;
  const clearFilters = () => {
    setQuery("");
    setCourses([]);
    setYears([]);
    setLengths([]);
    setSort("newest");
  };

  return (
    <PageWrapper>
      <Breadcrumbs current="Writing" />

      <header class="writing-hero">
        <div class="h2">Reports</div>
        <h1 class="h1-caps">Writing</h1>
        <p class="writing-intro">
          Course reports, security notes, and technical writeups from hands-on
          lab work.
        </p>
      </header>

      <div class="writing-toolbar">
        <label class="writing-search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="Search writing"
            onInput={(event) =>
              setQuery((event.currentTarget as HTMLInputElement).value)
            }
          />
        </label>
        <label class="writing-sort">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) =>
              setSort(
                (event.currentTarget as HTMLSelectElement).value as SortOption,
              )
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
            <option value="shortest">Shortest read</option>
            <option value="longest">Longest read</option>
          </select>
        </label>
        <button
          type="button"
          class="writing-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </button>
      </div>

      <div class="writing-active-filters" aria-live="polite">
        {[
          ...courses.map((value) => ({ group: "course", value })),
          ...years.map((value) => ({ group: "year", value })),
          ...lengths.map((value) => ({ group: "length", value })),
        ].map(({ group, value }) => (
          <button
            key={`${group}-${value}`}
            type="button"
            onClick={() => {
              if (group === "course") setCourses(toggleValue(courses, value));
              if (group === "year") setYears(toggleValue(years, value));
              if (group === "length") setLengths(toggleValue(lengths, value));
            }}
          >
            {value} <span>×</span>
          </button>
        ))}
        {(activeFilterCount > 0 || query) && (
          <button type="button" class="writing-clear" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      <div class="writing-results-heading">
        <span>Writing results</span>
        <span>
          {(filteredEntries?.length || 0).toString().padStart(2, "0")}
        </span>
      </div>

      <div class="writing-layout">
        <aside class={`writing-filters ${filtersOpen ? "is-open" : ""}`}>
          <div class="writing-filter-heading">
            <span>Filters</span>
            <span>{activeFilterCount.toString().padStart(2, "0")}</span>
          </div>
          <FacetGroup
            title="Course"
            options={courseOptions}
            selected={courses}
            onToggle={(value) => setCourses(toggleValue(courses, value))}
          />
          <FacetGroup
            title="Year"
            options={yearOptions}
            selected={years}
            onToggle={(value) => setYears(toggleValue(years, value))}
          />
          <FacetGroup
            title="Reading length"
            options={lengthOptions}
            selected={lengths}
            onToggle={(value) => setLengths(toggleValue(lengths, value))}
          />
        </aside>

        <section class="writing-results">
          {error ? (
            <p class="project-error">Error loading writing data: {error}</p>
          ) : !filteredEntries ? (
            <p class="paragraph">Loading writing…</p>
          ) : filteredEntries.length === 0 ? (
            <div class="writing-empty">
              <p>No writing matches the selected filters.</p>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div id="writing-cards">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.slug}
                  href={`/writing/${entry.slug}`}
                  variant="list"
                >
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
      </div>
    </PageWrapper>
  );
}

function FacetGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset class="writing-facet">
      <legend>{title}</legend>
      {options.map(({ value, count }) => (
        <label key={value}>
          <input
            type="checkbox"
            checked={selected.includes(value)}
            disabled={count === 0 && !selected.includes(value)}
            onChange={() => onToggle(value)}
          />
          <span>{value}</span>
          <span>{count.toString().padStart(2, "0")}</span>
        </label>
      ))}
    </fieldset>
  );
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
        return [entry.slug, calculateReadingTime(entry.summary || "")] as const;
      }
    }),
  );
  return Object.fromEntries(pairs);
}

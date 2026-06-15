import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import {
  ActiveFilters,
  CollectionToolbar,
  FacetGroup,
  FilterSidebar,
  ResultsHeading,
} from "../components/common/CollectionFilters";
import {
  fetchJson,
  getQueryOption,
  getQueryValue,
  getQueryValues,
  parseDateToMs,
  replaceQuery,
  toggleValue,
  type FacetOption,
} from "../utils/collections";
import { fetchReadingTimes } from "../utils/content";
import { formatReadingTime } from "../utils/readingTime";

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

type FacetField = "course" | "year" | "length";
type SortOption = "newest" | "oldest" | "title" | "shortest" | "longest";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
  { value: "shortest", label: "Shortest read" },
  { value: "longest", label: "Longest read" },
] satisfies Array<{ value: SortOption; label: string }>;

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
  const [query, setQuery] = useState(() => getQueryValue("q"));
  const [sort, setSort] = useState<SortOption>(() =>
    getQueryOption("sort", SORT_OPTIONS.map(({ value }) => value), "newest"),
  );
  const [courses, setCourses] = useState<string[]>(() =>
    getQueryValues("course"),
  );
  const [years, setYears] = useState<string[]>(() => getQueryValues("year"));
  const [lengths, setLengths] = useState<string[]>(() =>
    getQueryValues("length"),
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
        const times = await fetchReadingTimes(data, controller.signal);
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
    replaceQuery({
      q: query,
      course: courses,
      year: years,
      length: lengths,
      sort: sort === "newest" ? "" : sort,
    });
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
          return parseDateToMs(a.date) - parseDateToMs(b.date);
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "shortest")
          return (readTimes[a.slug] || 1) - (readTimes[b.slug] || 1);
        if (sort === "longest")
          return (readTimes[b.slug] || 1) - (readTimes[a.slug] || 1);
        return parseDateToMs(b.date) - parseDateToMs(a.date);
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

      <header class="collection-hero">
        <div class="h2">Reports</div>
        <h1 class="h1-caps">Writing</h1>
        <p class="collection-intro">
          Course reports, security notes, and technical writeups from hands-on
          lab work.
        </p>
      </header>

      <CollectionToolbar
        search={query}
        searchPlaceholder="Search writing"
        sort={sort}
        sortOptions={SORT_OPTIONS}
        filtersOpen={filtersOpen}
        activeFilterCount={activeFilterCount}
        onSearch={setQuery}
        onSort={setSort}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
      />

      <ActiveFilters
        filters={[
          ...courses.map((value) => ({ group: "course", value })),
          ...years.map((value) => ({ group: "year", value })),
          ...lengths.map((value) => ({ group: "length", value })),
        ].map(({ group, value }) => ({
          key: `${group}-${value}`,
          label: value,
          onRemove: () => {
            if (group === "course") setCourses(toggleValue(courses, value));
            if (group === "year") setYears(toggleValue(years, value));
            if (group === "length") setLengths(toggleValue(lengths, value));
          },
        }))}
        showClear={activeFilterCount > 0 || Boolean(query)}
        onClear={clearFilters}
      />

      <ResultsHeading
        label="Writing results"
        count={filteredEntries?.length || 0}
      />

      <div class="collection-layout">
        <FilterSidebar
          open={filtersOpen}
          activeFilterCount={activeFilterCount}
        >
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
        </FilterSidebar>

        <section class="collection-results">
          {error ? (
            <p class="project-error">Error loading writing data: {error}</p>
          ) : !filteredEntries ? (
            <p class="paragraph">Loading writing…</p>
          ) : filteredEntries.length === 0 ? (
            <div class="collection-empty">
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

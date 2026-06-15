import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import "./Work.css";

type ProjectIndexItem = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  summary?: string;
  date?: string;
  image?: string;
  imageAlt?: string;
  tags?: string[];
  category?: string;
  type?: string;
  featured?: boolean;
};

type FacetOption = {
  value: string;
  count: number;
};

type SortOption = "newest" | "oldest" | "featured" | "title";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

function parseDateToMs(input: string | undefined): number {
  if (!input) return 0;
  const [day, month, year] = input.split(".").map(Number);
  return day && month && year ? new Date(year, month - 1, day).getTime() : 0;
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
  return sort === "oldest" || sort === "featured" || sort === "title"
    ? sort
    : "newest";
}

function buildFacet(
  projects: ProjectIndexItem[],
  eligibleProjects: ProjectIndexItem[],
  field: "category" | "type",
): FacetOption[] {
  const values = new Set<string>();
  const counts = new Map<string, number>();
  projects.forEach((project) => {
    const value = project[field];
    if (value) values.add(value);
  });
  eligibleProjects.forEach((project) => {
    const value = project[field];
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
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

function formatLabel(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function matchesSearch(project: ProjectIndexItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [
    project.title,
    project.subtitle,
    project.summary,
    project.category,
    project.type,
    ...(project.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function Work() {
  const [projects, setProjects] = useState<ProjectIndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") || "";
  });
  const [sort, setSort] = useState<SortOption>(getInitialSort);
  const [categories, setCategories] = useState<string[]>(() =>
    getInitialValues("category"),
  );
  const [types, setTypes] = useState<string[]>(() => getInitialValues("type"));
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        setProjects(
          await fetchJson<ProjectIndexItem[]>(
            "/projects/index.json",
            controller.signal,
          ),
        );
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load projects",
        );
        setProjects([]);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (categories.length) params.set("category", categories.join(","));
    if (types.length) params.set("type", types.join(","));
    if (sort !== "newest") params.set("sort", sort);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [search, categories, types, sort]);

  const categoryOptions = useMemo(
    () =>
      buildFacet(
        projects || [],
        (projects || []).filter(
          (project) =>
            matchesSearch(project, search) &&
            (!types.length || (!!project.type && types.includes(project.type))),
        ),
        "category",
      ),
    [projects, search, types],
  );
  const typeOptions = useMemo(
    () =>
      buildFacet(
        projects || [],
        (projects || []).filter(
          (project) =>
            matchesSearch(project, search) &&
            (!categories.length ||
              (!!project.category && categories.includes(project.category))),
        ),
        "type",
      ),
    [projects, search, categories],
  );

  const filteredProjects = useMemo(() => {
    if (!projects) return null;
    return projects
      .filter((project) => {
        return (
          matchesSearch(project, search) &&
          (!categories.length ||
            (!!project.category && categories.includes(project.category))) &&
          (!types.length || (!!project.type && types.includes(project.type)))
        );
      })
      .sort((a, b) => {
        if (sort === "oldest")
          return parseDateToMs(a.date) - parseDateToMs(b.date);
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "featured") {
          return (
            Number(!!b.featured) - Number(!!a.featured) ||
            parseDateToMs(b.date) - parseDateToMs(a.date)
          );
        }
        return parseDateToMs(b.date) - parseDateToMs(a.date);
      });
  }, [projects, search, categories, types, sort]);

  const featuredProject =
    filteredProjects?.find((project) => project.featured) || null;
  const archiveProjects =
    filteredProjects?.filter((project) => project !== featuredProject) || [];
  const activeFilterCount = categories.length + types.length;

  const clearFilters = () => {
    setSearch("");
    setCategories([]);
    setTypes([]);
    setSort("newest");
  };

  return (
    <PageWrapper>
      <Breadcrumbs current="Work" />

      <header class="work-hero">
        <div class="h2">Projects</div>
        <h1 class="h1-caps">Work</h1>
        <p class="work-intro">
          Security, infrastructure, and software projects documenting how I
          approach practical problems and develop systems over time.
        </p>
      </header>

      <div class="work-toolbar">
        <label class="work-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onInput={(event) =>
              setSearch((event.currentTarget as HTMLInputElement).value)
            }
            placeholder="Search projects"
          />
        </label>
        <label class="work-sort">
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
            <option value="featured">Featured first</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
        <button
          type="button"
          class="work-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
        </button>
      </div>

      <div class="work-active-filters" aria-live="polite">
        {[
          ...categories.map((value) => ({ group: "category", value })),
          ...types.map((value) => ({ group: "type", value })),
        ].map(({ group, value }) => (
          <button
            key={`${group}-${value}`}
            type="button"
            onClick={() =>
              group === "category"
                ? setCategories(toggleValue(categories, value))
                : setTypes(toggleValue(types, value))
            }
          >
            {formatLabel(value)} <span>×</span>
          </button>
        ))}
        {(activeFilterCount > 0 || search) && (
          <button type="button" class="work-clear" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      <div class="work-results-heading">
        <span>Project results</span>
        <span>
          {(filteredProjects?.length || 0).toString().padStart(2, "0")}
        </span>
      </div>
      <div class="work-layout">
        <aside class={`work-filters ${filtersOpen ? "is-open" : ""}`}>
          <div class="work-filter-heading">
            <span>Filters</span>
            <span>{activeFilterCount.toString().padStart(2, "0")}</span>
          </div>
          <FacetGroup
            title="Category"
            options={categoryOptions}
            selected={categories}
            onToggle={(value) => setCategories(toggleValue(categories, value))}
          />
          <FacetGroup
            title="Project type"
            options={typeOptions}
            selected={types}
            onToggle={(value) => setTypes(toggleValue(types, value))}
          />
        </aside>
        <main class="work-results">
          {error ? (
            <p class="project-error">Error loading projects data: {error}</p>
          ) : !filteredProjects ? (
            <p class="paragraph">Loading projects…</p>
          ) : filteredProjects.length === 0 ? (
            <div class="work-empty">
              <p>No projects match the selected filters.</p>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {featuredProject && (
                <section class="work-featured" aria-labelledby="featured-work">
                  <div id="featured-work" class="work-section-label">
                    Featured work
                  </div>
                  <FeaturedProject project={featuredProject} />
                </section>
              )}

              {archiveProjects.length > 0 && (
                <section class="work-archive" aria-labelledby="project-archive">
                  <div id="project-archive" class="work-section-label">
                    Project archive
                  </div>
                  {archiveProjects.map((project) => (
                    <ProjectRow key={project.slug} project={project} />
                  ))}
                </section>
              )}
            </>
          )}
        </main>{" "}
        <div class="space-50" />
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
    <fieldset class="work-facet">
      <legend>{title}</legend>
      {options.map(({ value, count }) => (
        <label key={value}>
          <input
            type="checkbox"
            checked={selected.includes(value)}
            disabled={count === 0 && !selected.includes(value)}
            onChange={() => onToggle(value)}
          />
          <span>{formatLabel(value)}</span>
          <span>{count.toString().padStart(2, "0")}</span>
        </label>
      ))}
    </fieldset>
  );
}

function FeaturedProject({ project }: { project: ProjectIndexItem }) {
  return (
    <article class="work-featured-project">
      <a href={`/work/${project.slug}`}>
        <div class="work-featured-image">
          {project.image && (
            <img
              src={project.image}
              alt={project.imageAlt || project.title}
              loading="lazy"
            />
          )}
        </div>
        <div class="work-featured-content">
          <div class="work-project-meta">
            <span>{project.id ? `ID ${project.id}` : "Featured"}</span>
            <span>{formatLabel(project.category || "Project")}</span>
          </div>
          <h2>{project.title}</h2>
          {project.summary && <p>{project.summary}</p>}
          <div class="work-project-footer">
            <span>{project.date}</span>
            <span>View project →</span>
          </div>
        </div>
      </a>
    </article>
  );
}

function ProjectRow({ project }: { project: ProjectIndexItem }) {
  return (
    <article class="work-project-row">
      <a href={`/work/${project.slug}`}>
        <span class="work-project-id">{project.id || "—"}</span>
        <span class="work-project-title">
          <strong>{project.title}</strong>
          <small>{project.subtitle}</small>
        </span>
        <span class="work-project-category">
          {formatLabel(project.category || "Project")}
        </span>
        <span class="work-project-type">
          {formatLabel(project.type || "Unspecified")}
        </span>
        <span class="work-project-date">{project.date}</span>
        <span class="work-project-arrow">→</span>
      </a>
    </article>
  );
}

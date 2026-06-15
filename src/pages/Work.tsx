import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
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
  formatLabel,
  getQueryOption,
  getQueryValue,
  getQueryValues,
  parseDateToMs,
  replaceQuery,
  toggleValue,
  type FacetOption,
} from "../utils/collections";
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

type SortOption = "newest" | "oldest" | "featured" | "title";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "featured", label: "Featured first" },
  { value: "title", label: "Title A–Z" },
] satisfies Array<{ value: SortOption; label: string }>;

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
  const [search, setSearch] = useState(() => getQueryValue("q"));
  const [sort, setSort] = useState<SortOption>(() =>
    getQueryOption("sort", SORT_OPTIONS.map(({ value }) => value), "newest"),
  );
  const [categories, setCategories] = useState<string[]>(() =>
    getQueryValues("category"),
  );
  const [types, setTypes] = useState<string[]>(() => getQueryValues("type"));
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
    replaceQuery({
      q: search,
      category: categories,
      type: types,
      sort: sort === "newest" ? "" : sort,
    });
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

      <header class="collection-hero">
        <div class="h2">Projects</div>
        <h1 class="h1-caps">Work</h1>
        <p class="collection-intro">
          Security, infrastructure, and software projects documenting how I
          approach practical problems and develop systems over time.
        </p>
      </header>

      <CollectionToolbar
        search={search}
        searchPlaceholder="Search projects"
        sort={sort}
        sortOptions={SORT_OPTIONS}
        filtersOpen={filtersOpen}
        activeFilterCount={activeFilterCount}
        onSearch={setSearch}
        onSort={setSort}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
      />

      <ActiveFilters
        filters={[
          ...categories.map((value) => ({ group: "category", value })),
          ...types.map((value) => ({ group: "type", value })),
        ].map(({ group, value }) => ({
          key: `${group}-${value}`,
          label: formatLabel(value),
          onRemove: () =>
            group === "category"
              ? setCategories(toggleValue(categories, value))
              : setTypes(toggleValue(types, value)),
        }))}
        showClear={activeFilterCount > 0 || Boolean(search)}
        onClear={clearFilters}
      />

      <ResultsHeading
        label="Project results"
        count={filteredProjects?.length || 0}
      />
      <div class="collection-layout">
        <FilterSidebar
          open={filtersOpen}
          activeFilterCount={activeFilterCount}
        >
          <FacetGroup
            title="Category"
            options={categoryOptions}
            selected={categories}
            formatValue={formatLabel}
            onToggle={(value) => setCategories(toggleValue(categories, value))}
          />
          <FacetGroup
            title="Project type"
            options={typeOptions}
            selected={types}
            formatValue={formatLabel}
            onToggle={(value) => setTypes(toggleValue(types, value))}
          />
        </FilterSidebar>
        <main class="collection-results">
          {error ? (
            <p class="project-error">Error loading projects data: {error}</p>
          ) : !filteredProjects ? (
            <p class="paragraph">Loading projects…</p>
          ) : filteredProjects.length === 0 ? (
            <div class="collection-empty">
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

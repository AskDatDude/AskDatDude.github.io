import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";

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
  status?: string;
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

export function Work() {
  const [projects, setProjects] = useState<ProjectIndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>(ALL_TAG);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        const data = await fetchJson<ProjectIndexItem[]>(
          "/projects/index.json",
          controller.signal,
        );
        setProjects(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load projects");
        setProjects([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const tagCounts = useMemo<TagCount[]>(() => {
    if (!projects) return [];
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      project.tags?.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return null;
    if (activeTag === ALL_TAG) return projects;
    return projects.filter((project) => project.tags?.includes(activeTag));
  }, [projects, activeTag]);

  return (
    <PageWrapper>
      <section class="script-section">
        <div class="h2">Projects</div>
        <div class="h1-caps">Work</div>
        <p class="paragraph">
          A focused set of security, web, and infrastructure projects that map
          my progression from student work to production-minded builds.
        </p>
      </section>

      <div class="line" />
      <div class="space-50" />

      {projects && tagCounts.length > 0 && (
        <div class="tag-buttons" aria-label="Filter projects by tag">
          <button
            type="button"
            class={`tag-button ${activeTag === ALL_TAG ? "active" : ""}`}
            aria-pressed={activeTag === ALL_TAG}
            onClick={() => setActiveTag(ALL_TAG)}
          >
            All projects ({projects.length})
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

      <section class="project-section">
        {error ? (
          <p class="project-error">Error loading projects data: {error}</p>
        ) : !filteredProjects ? (
          <p class="paragraph">Loading projects…</p>
        ) : filteredProjects.length === 0 ? (
          <p class="paragraph">No projects found.</p>
        ) : (
          <div class="grid">
            {filteredProjects.map((project) => (
              <Card
                key={project.slug}
                href={`/work/${project.slug}`}
                variant="project"
                class="project-visible"
              >
                <div class="header">
                  {project.date && <div class="h3">{project.date}</div>}
                  {project.id && <div class="h3">ID {project.id}</div>}
                </div>

                {project.image && (
                  <img
                    src={project.image}
                    alt={project.imageAlt || project.title}
                    loading="lazy"
                  />
                )}

                <div class="big-card-header">{project.title}</div>
                {project.subtitle && <div class="h2">{project.subtitle}</div>}

                {!!project.tags?.length && (
                  <div class="tags">
                    {project.tags.map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}

import { useEffect, useMemo, useState } from "preact/hooks";
import { BackToTop } from "../components/common/BackToTop";
import { LinkButton } from "../components/common/Button";
import { ReadingLayout } from "../components/reading/ReadingLayout";
import { parseFrontmatter, type Frontmatter } from "../utils/frontmatter";
import {
  extractTableOfContents,
  renderMarkdown,
  type TableOfContentsItem,
} from "../utils/markdown";
import { getString, getStringArray, isValidSlug } from "../utils/content";
import { formatLabel } from "../utils/collections";
import "./WorkDetail.css";

type WorkDetailProps = {
  slug?: string;
};

type ProjectButton = {
  text: string;
  url: string;
};

type ProjectContent = {
  metadata: Frontmatter;
  html: string;
  tableOfContents: TableOfContentsItem[];
};

const INFO_FIELDS = [
  { key: "creators", label: "Creators" },
  { key: "collaborators", label: "Collaborators" },
  { key: "duration", label: "Duration" },
  { key: "tools", label: "Tools" },
  { key: "date", label: "Date" },
  { key: "originalSource", label: "Original Source" },
];

export function WorkDetail({ slug }: WorkDetailProps) {
  const [project, setProject] = useState<ProjectContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const projectSlug = slug?.trim();

    if (!projectSlug) {
      setError("Project slug missing.");
      setProject(null);
      return () => controller.abort();
    }

    if (!isValidSlug(projectSlug)) {
      setError("Invalid project slug.");
      setProject(null);
      return () => controller.abort();
    }

    (async () => {
      try {
        setError(null);
        const res = await fetch(`/projects/${projectSlug}.md`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? "Project not found." : "Failed to load project.",
          );
        }
        const raw = await res.text();
        const { metadata, content } = parseFrontmatter(raw);
        const html = renderMarkdown(content);
        const tableOfContents = extractTableOfContents(content);
        setProject({ metadata, html, tableOfContents });

        const title =
          typeof metadata.title === "string" ? metadata.title : "Project";
        document.title = `${title} - Robin Niinemets`;
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load project.");
        setProject(null);
      }
    })();

    return () => controller.abort();
  }, [slug]);

  const metadata = project?.metadata;
  const title = getString(metadata?.title) || slug || "Project";
  const id = getString(metadata?.id);
  const subtitle = getString(metadata?.subtitle);
  const image = getString(metadata?.image);
  const imageAlt = getString(metadata?.imageAlt);
  const category = getString(metadata?.category);
  const type = getString(metadata?.type);

  const buttons = useMemo(() => getButtons(metadata), [metadata]);

  const infoSections = useMemo(() => {
    if (!metadata) return [];
    return INFO_FIELDS.map((field) => ({
      label: field.label,
      items: getStringArray(metadata[field.key]),
    })).filter((section) => section.items.length > 0);
  }, [metadata]);

  const heroMetaSections = useMemo(() => {
    const sections = [
      id ? { label: "Project", items: [`ID ${id}`] } : null,
      category ? { label: "Category", items: [formatLabel(category)] } : null,
      type ? { label: "Project type", items: [formatLabel(type)] } : null,
      ...infoSections,
    ].filter((section): section is { label: string; items: string[] } =>
      Boolean(section),
    );

    const seenLabels = new Set<string>();
    return sections.filter((section) => {
      const key = section.label.toLowerCase();
      if (seenLabels.has(key)) return false;
      seenLabels.add(key);
      return true;
    });
  }, [category, id, infoSections, type]);

  const imageSrc = image ? (image.startsWith("/") ? image : `/${image}`) : "";

  return (
    <main class="work-detail-page">
      {error ? (
        <div class="reading-status">
          <p class="project-error">{error}</p>
        </div>
      ) : !project ? (
        <div class="reading-status">
          <p class="paragraph">Loading project…</p>
        </div>
      ) : (
        <>
          <header class={`work-detail-hero${imageSrc ? " has-image" : ""}`}>
            <aside class="work-detail-rail" aria-label="Project overview">
              <a class="work-detail-back" href="/work">
                ← All work
              </a>

              {!!heroMetaSections.length && (
                <dl class="work-detail-meta-list" aria-label="Project metadata">
                  {heroMetaSections.map((section) => (
                    <div class="work-detail-meta-row" key={section.label}>
                      <dt>{section.label}</dt>
                      <dd>{section.items.join(", ")}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {!!buttons.length && (
                <div class="work-detail-actions">
                  {buttons.map((button) => {
                    const isExternal = /^https?:\/\//.test(button.url);
                    return (
                      <LinkButton
                        key={`${button.text}-${button.url}`}
                        href={button.url}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                      >
                        {button.text}
                      </LinkButton>
                    );
                  })}
                </div>
              )}
            </aside>

            <div class="work-detail-main">
              {subtitle && <p class="work-detail-kicker">{subtitle}</p>}
              <h1 class="work-detail-title">{title}</h1>

              {imageSrc && (
                <figure class="work-detail-image">
                  <img
                    id="project-hero-img"
                    src={imageSrc}
                    alt={imageAlt || title}
                  />
                </figure>
              )}
            </div>
          </header>

          <ReadingLayout
            backHref="/work"
            backLabel="All work"
            tableOfContents={project.tableOfContents}
            html={project.html}
          />

          <div class="space-100" />
        </>
      )}
      <BackToTop variant="project" />
    </main>
  );
}

function getButtons(metadata: Frontmatter | null | undefined): ProjectButton[] {
  if (!metadata) return [];
  const raw = metadata.buttons;
  if (!Array.isArray(raw)) return [];
  const buttons: ProjectButton[] = [];

  raw.forEach((item) => {
    if (isProjectButton(item)) {
      buttons.push(item);
    }
  });

  return buttons;
}

function isProjectButton(value: unknown): value is ProjectButton {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.text === "string" && typeof record.url === "string";
}

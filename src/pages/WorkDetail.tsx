import { useEffect, useMemo, useState } from "preact/hooks";
import { BackToTop } from "../components/common/BackToTop";
import { LinkButton } from "../components/common/Button";
import { ReadingIntro } from "../components/reading/ReadingIntro";
import { ReadingLayout } from "../components/reading/ReadingLayout";
import { parseFrontmatter, type Frontmatter } from "../utils/frontmatter";
import {
  extractTableOfContents,
  renderMarkdown,
  type TableOfContentsItem,
} from "../utils/markdown";
import { getString, getStringArray, isValidSlug } from "../utils/content";
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
  const subtitle = getString(metadata?.subtitle);
  const summary = getString(metadata?.summary);
  const image = getString(metadata?.image);
  const imageAlt = getString(metadata?.imageAlt);

  const buttons = useMemo(() => getButtons(metadata), [metadata]);

  const infoSections = useMemo(() => {
    if (!metadata) return [];
    return INFO_FIELDS.map((field) => ({
      label: field.label,
      items: getStringArray(metadata[field.key]),
    })).filter((section) => section.items.length > 0);
  }, [metadata]);

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
          {imageSrc && (
            <img
              class="hero-img"
              id="project-hero-img"
              src={imageSrc}
              alt={imageAlt || title}
            />
          )}

          <ReadingIntro
            title={title}
            subtitle={subtitle}
            summary={summary}
            info={infoSections.map((section) => ({
              label: section.label,
              values: section.items,
            }))}
            actions={
              buttons.length ? (
                <div class="buttons">
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
              ) : undefined
            }
          />

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

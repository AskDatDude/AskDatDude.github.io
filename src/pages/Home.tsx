import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";
import { Button } from "../components/common/Button";
import {
  calculateReadingTime,
  formatReadingTime,
} from "../utils/readingTime";
import "./Home.css";

type ProjectIndexItem = {
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

type WritingIndexItem = {
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  tags?: string[];
  id?: string;
  week?: string;
  featured?: boolean;
};

function parseDotDateToMs(input: string | undefined): number {
  // Expected: DD.MM.YYYY (as used in existing index JSON files)
  if (!input) return 0;
  const parts = input.split(".").map((p) => Number(p));
  if (parts.length !== 3) return 0;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy) return 0;
  return new Date(yyyy, mm - 1, dd).getTime();
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

export function Home() {
  const [projects, setProjects] = useState<ProjectIndexItem[] | null>(null);
  const [writing, setWriting] = useState<WritingIndexItem[] | null>(null);
  const [readTimes, setReadTimes] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        const [p, w] = await Promise.all([
          fetchJson<ProjectIndexItem[]>(
            "/projects/index.json",
            controller.signal,
          ),
          fetchJson<WritingIndexItem[]>(
            "/writing/index.json",
            controller.signal,
          ),
        ]);
        setProjects(p);
        setWriting(w);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(
          e instanceof Error ? e.message : "Failed to load homepage data",
        );
        setProjects([]);
        setWriting([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const featuredProjects = useMemo(() => {
    if (!projects) return null;
    const featured = projects.filter((p) => p.featured);
    return (featured.length ? featured : projects).slice(0, 4);
  }, [projects]);

  const latestWriting = useMemo(() => {
    if (!writing) return null;
    const sorted = [...writing].sort(
      (a, b) => parseDotDateToMs(b.date) - parseDotDateToMs(a.date),
    );
    return sorted.slice(0, 4);
  }, [writing]);

  useEffect(() => {
    if (!latestWriting?.length) return;

    const controller = new AbortController();

    (async () => {
      const pairs = await Promise.all(
        latestWriting.map(async (entry) => {
          try {
            const response = await fetch(`/writing/entries/${entry.slug}.md`, {
              signal: controller.signal,
            });
            const content = response.ok
              ? await response.text()
              : entry.summary || "";
            return [entry.slug, calculateReadingTime(content)] as const;
          } catch {
            return [
              entry.slug,
              calculateReadingTime(entry.summary || ""),
            ] as const;
          }
        }),
      );

      if (!controller.signal.aborted) {
        setReadTimes(Object.fromEntries(pairs));
      }
    })();

    return () => controller.abort();
  }, [latestWriting]);

  return (
    <PageWrapper>
      <section class="home-hero">
        <div class="title">Robin Niinemets</div>
        <div class="subtitle paragraph-caps">
          Cybersecurity student · Helsinki, Finland
        </div>

        <div class="home-cta-row" aria-label="Primary navigation">
          <Button href="/work" variant="primary" class="home-cta">
            View work
          </Button>
          <Button href="/writing" variant="ghost" class="home-cta">
            Read writing
          </Button>
          <Button href="/tools" variant="ghost" class="home-cta">
            Tools
          </Button>
          <Button href="/about" variant="outline" class="home-cta">
            About
          </Button>
        </div>

        <p class="blurb paragraph">
          Robin. Full time cybersecurity student at{" "}
          <a
            class="link-style"
            href="https://www.haaga-helia.fi/en"
            data-replace="Haaga-Helia"
            target="_blank"
            rel="noreferrer"
          >
            <span>Haaga-Helia</span>
          </a>{" "}
          studying{" "}
          <a
            class="link-style"
            href="https://www.haaga-helia.fi/en/bachelor/degree-programme-business-information-technology"
            data-replace="Business Information Technologies"
            target="_blank"
            rel="noreferrer"
          >
            <span>Business Information Technologies</span>
          </a>
          , pursuing a career in security engineering with the ultimate goal to
          contribute to space industry security development.
        </p>

        <p class="blurb paragraph home-hero-secondary">
          From learning the Linux and Windows basics, to building small
          networks. Learning network enumeration with Nmap and completing my
          first box on Hack The Box.
          <br />
          <br />
          I’ve learned by building my own cybersecurity projects and by founding
          a{" "}
          <a
            class="link-style"
            href="https://askdatdude.github.io/H-T8/"
            data-replace="hacking club"
            target="_blank"
            rel="noreferrer"
          >
            <span>hacking club</span>
          </a>{" "}
          in Haaga-Helia. Constantly learning and evolving as a student.
          <br />
          <br />
          You can follow my progress on Hack The Box{" "}
          <a
            class="link-style"
            href="https://app.hackthebox.com/profile/1665694"
            data-replace="here."
            target="_blank"
            rel="noreferrer"
          >
            <span>here.</span>
          </a>
        </p>
      </section>

      <div class="line" />
      <div class="space-50" />

      {error && (
        <div class="home-error">
          <p class="paragraph">
            <span class="home-muted">Homepage data failed to load:</span>{" "}
            {error}
          </p>
        </div>
      )}

      <section class="home-section project-section">
        <div class="home-section-header">
          <div>
            <div class="h2">Featured</div>
            <div class="h1-caps">Work</div>
          </div>
          <div class="actions">
            <Button href="/work" variant="ghost">
              All projects
            </Button>
          </div>
        </div>

        <div class="space-50" />

        {!featuredProjects ? (
          <div class="home-skeleton paragraph">Loading projects…</div>
        ) : featuredProjects.length === 0 ? (
          <p class="paragraph home-muted">No projects found.</p>
        ) : (
          <div class="grid">
            {featuredProjects.map((p) => (
              <Card
                key={p.slug}
                href={`/work/${p.slug}`}
                variant="project"
                class="project-visible"
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.imageAlt || p.title}
                    loading="lazy"
                  />
                )}

                <div class="header">
                  <div class="big-card-header">{p.title}</div>
                  {p.date && <div class="h2">{p.date}</div>}
                </div>

                {p.subtitle && <div class="h2">{p.subtitle}</div>}

                {p.summary && <p class="paragraph">{p.summary}</p>}

                {!!p.tags?.length && (
                  <div class="tags">
                    {p.tags.slice(0, 6).map((t) => (
                      <Tag key={t} label={t} />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section class="home-section home-writing-section">
        <div class="home-section-header">
          <div>
            <div class="h2">Latest</div>
            <div class="h1-caps">Writing</div>
          </div>
          <div class="actions">
            <Button href="/writing" variant="ghost">
              All entries
            </Button>
          </div>
        </div>

        <div class="space-50" />

        {!latestWriting ? (
          <div class="home-skeleton paragraph">Loading writing…</div>
        ) : latestWriting.length === 0 ? (
          <p class="paragraph home-muted">No writing found.</p>
        ) : (
          <div id="writing-cards" class="home-writing-grid">
            {latestWriting.map((e) => (
              <Card
                key={e.slug}
                href={`/writing/${e.slug}`}
                variant="list"
                class="home-writing-item"
              >
                <div class="header">
                  <p class="h3">{e.date || ""}</p>
                  <p class="h3">{e.week || e.id || ""}</p>
                </div>

                <div class="content">
                  <div class="medium-card-header">{e.title}</div>
                  {e.id && <div class="h3">{e.id}</div>}
                  {e.summary ? (
                    <p class="paragraph">{e.summary}</p>
                  ) : (
                    <p class="paragraph home-muted">Open entry →</p>
                  )}
                </div>

                <div class="container">
                  <span class="read-time">
                    {formatReadingTime(readTimes[e.slug] || 1)}
                  </span>
                  {!!e.tags?.length && (
                    <div class="tags">
                      {e.tags.slice(0, 3).map((t) => (
                        <span key={t} class="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section class="home-section">
        <div class="h2">Elsewhere</div>
        <div class="space-20" />
        <p class="paragraph">
          <a
            class="paragraph-link"
            href="https://github.com/AskDatDude"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          {" · "}
          <a
            class="paragraph-link"
            href="https://www.linkedin.com/in/robin-niinemets-496194185/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          {" · "}
          <a class="paragraph-link" href="mailto:robba355@gmail.com">
            Email
          </a>
        </p>
      </section>
    </PageWrapper>
  );
}

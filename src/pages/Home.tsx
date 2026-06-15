import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";
import { Button } from "../components/common/Button";
import { fetchJson, parseDateToMs } from "../utils/collections";
import { fetchReadingTimes } from "../utils/content";
import { formatReadingTime } from "../utils/readingTime";
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
      (a, b) => parseDateToMs(b.date) - parseDateToMs(a.date),
    );
    return sorted.slice(0, 4);
  }, [writing]);

  useEffect(() => {
    if (!latestWriting?.length) return;

    const controller = new AbortController();

    (async () => {
      const times = await fetchReadingTimes(latestWriting, controller.signal);

      if (!controller.signal.aborted) {
        setReadTimes(times);
      }
    })();

    return () => controller.abort();
  }, [latestWriting]);

  return (
    <PageWrapper>
      <section class="home-hero">
        <div class="title">Robin Niinemets</div>
        <div class="subtitle paragraph-caps">
          Security engineering · Defense-oriented cyber resilience · Helsinki,
          Finland
        </div>

        <p class="blurb paragraph">
          I’m Robin, building a career and a company at the intersection of
          cybersecurity, resilient systems, and high-stakes technology.
        </p>

        <p class="blurb paragraph home-hero-secondary">
          My work covers a wide cybersecurity base: offensive security, Linux
          environments, network enumeration, infrastructure hardening, secure
          web systems, OSINT, monitoring, and practical security tooling. I’ve
          developed this through project-based work, technical experimentation,
          and community building, including founding{" "}
          <a
            class="link-style"
            href="https://askdatdude.github.io/H-T8/"
            data-replace="H-T8"
            target="_blank"
            rel="noreferrer"
          >
            <span>H-T8</span>
          </a>
          {""}
          , a hacking club focused on ethical hacking, competitions, and
          hands-on learning.
          <br />
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
            <Button href="/" variant="outline" class="home-cta">
              Nothing
            </Button>
          </div>
          <br />
          The main direction of my work is Negative Space Systems, a
          cybersecurity and defense-oriented project focused on larger
          organizational hardening, system resilience and security for
          organizations operating under regulated or higly sensitive fields. The
          idea behind Negative Space is to help organizations find what their
          current security, architecture, and operations do not show them before
          hostile conditions expose it.
          <br />
          <br />
          This portfolio documents the projects, research, and technical
          development behind that direction.
        </p>

        <section class="home-building" aria-labelledby="currently-building">
          <div id="currently-building" class="home-building-heading">
            Currently building
          </div>
          <div class="home-building-grid">
            <div class="home-building-item">
              <div class="home-building-logo-frame">
                <img
                  class="home-building-logo home-building-logo-mark"
                  src="/assets/brand/h-t8.webp"
                  alt="H-T8"
                />
              </div>
              <div class="home-building-description">Hacking community</div>
            </div>
            <div class="home-building-item">
              <div class="home-building-logo-frame">
                <img
                  class="home-building-logo home-building-logo-wide"
                  src="/assets/brand/negative-space-systems.webp"
                  alt="Negative Space Systems"
                />
              </div>
              <div class="home-building-description">
                Cybersecurity & Defence Company
              </div>
            </div>
          </div>
        </section>
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

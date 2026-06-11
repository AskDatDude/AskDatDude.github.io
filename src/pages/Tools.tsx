import { useEffect, useMemo, useState } from "preact/hooks";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Card } from "../components/common/Card";
import { Tag } from "../components/common/Tag";

type ToolIndexItem = {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  url: string;
  tags?: string[];
  icon?: string;
  category?: string;
  platform?: string;
  status?: string;
  featured?: boolean;
};

type CategoryCount = {
  category: string;
  count: number;
};

type ToolGroup = {
  category: string;
  tools: ToolIndexItem[];
};

const ALL_CATEGORY = "all";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  return (await res.json()) as T;
}

export function Tools() {
  const [tools, setTools] = useState<ToolIndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        const data = await fetchJson<ToolIndexItem[]>(
          "/toolbox/index.json",
          controller.signal,
        );
        setTools(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load tools");
        setTools([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const categoryCounts = useMemo<CategoryCount[]>(() => {
    if (!tools) return [];
    const counts = new Map<string, number>();
    tools.forEach((tool) => {
      const category = tool.category || "Other";
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([category, count]) => ({ category, count }));
  }, [tools]);

  const filteredTools = useMemo(() => {
    if (!tools) return null;
    if (activeCategory === ALL_CATEGORY) return tools;
    return tools.filter(
      (tool) => (tool.category || "Other") === activeCategory,
    );
  }, [tools, activeCategory]);

  const groupedTools = useMemo<ToolGroup[]>(() => {
    if (!filteredTools) return [];

    const groups = new Map<string, ToolIndexItem[]>();

    filteredTools.forEach((tool) => {
      const category = tool.category || "Other";
      const list = groups.get(category) || [];
      list.push(tool);
      groups.set(category, list);
    });

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items]) => ({ category, tools: items }));
  }, [filteredTools]);

  return (
    <PageWrapper>
      <section class="script-section">
        <div class="h2">Utilities</div>
        <div class="h1-caps">Tools</div>
        <p class="paragraph">
          Small browser tools that run as standalone local-first utilities.
        </p>
      </section>

      <div class="line" />
      <div class="space-50" />

      {tools && categoryCounts.length > 0 && (
        <div class="tag-buttons" aria-label="Filter tools by category">
          <button
            type="button"
            class={`tag-button ${activeCategory === ALL_CATEGORY ? "active" : ""}`}
            aria-pressed={activeCategory === ALL_CATEGORY}
            onClick={() => setActiveCategory(ALL_CATEGORY)}
          >
            All tools ({tools.length})
          </button>
          {categoryCounts.map(({ category, count }) => (
            <button
              key={category}
              type="button"
              class={`tag-button ${activeCategory === category ? "active" : ""}`}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category} ({count})
            </button>
          ))}
        </div>
      )}

      <div class="space-50" />

      <section class="script-section">
        {error ? (
          <p class="project-error">Error loading tools data: {error}</p>
        ) : !filteredTools ? (
          <p class="paragraph">Loading tools…</p>
        ) : filteredTools.length === 0 ? (
          <p class="paragraph">No tools found.</p>
        ) : (
          groupedTools.map((group) => (
            <section key={group.category} class="home-section">
              <div class="header">
                <div class="h2">{group.category}</div>
                <div class="h3">{group.tools.length} items</div>
              </div>

              <div class="space-20" />

              <div id="writing-cards">
                {group.tools.map((tool) => (
                  <Card
                    key={tool.id}
                    href={tool.url}
                    variant="list"
                    class="tool-card"
                  >
                    <div class="header">
                      <div class="h3">{tool.category || "Tool"}</div>
                      {tool.status && <div class="h3">{tool.status}</div>}
                    </div>

                    <div class="content">
                      <div class="medium-card-header">
                        {tool.icon ? `${tool.icon} ` : ""}
                        {tool.title}
                      </div>
                      {tool.platform && <div class="h3">{tool.platform}</div>}
                      {tool.description && (
                        <p class="paragraph">{tool.description}</p>
                      )}
                    </div>

                    <div class="space-50" />

                    <div class="container">
                      <div class="read-time">{tool.slug || tool.id}</div>
                      {!!tool.tags?.length && (
                        <div class="tags">
                          {tool.tags.slice(0, 3).map((tag) => (
                            <Tag key={tag} label={tag} />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </PageWrapper>
  );
}

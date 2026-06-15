import { useEffect, useState } from "preact/hooks";
import { Breadcrumbs } from "../components/common/Breadcrumbs";
import { Card } from "../components/common/Card";
import { PageWrapper } from "../components/layout/PageWrapper";
import { fetchJson } from "../utils/collections";
import "./Tools.css";

type ToolIndexItem = {
  id: string;
  title: string;
  description?: string;
  url: string;
};

export function Tools() {
  const [tools, setTools] = useState<ToolIndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchJson<ToolIndexItem[]>("/toolbox/index.json", controller.signal)
      .then(setTools)
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load tools",
        );
        setTools([]);
      });

    return () => controller.abort();
  }, []);

  return (
    <PageWrapper>
      <Breadcrumbs current="Tools" />

      <section class="script-section tools-intro">
        <div class="h2">Browser utilities</div>
        <div class="h1-caps">Tools</div>
        <p class="paragraph">
          Small, focused utilities that run directly in the browser.
        </p>
      </section>

      {error ? (
        <p class="project-error">Error loading tools data: {error}</p>
      ) : !tools ? (
        <p class="paragraph">Loading tools…</p>
      ) : (
        <div id="writing-cards" class="tools-grid">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              href={tool.url}
              variant="list"
            >
              <div class="content">
                <div class="medium-card-header">{tool.title}</div>
                {tool.description && (
                  <p class="paragraph">{tool.description}</p>
                )}
              </div>
              <div class="container">
                <div class="read-time">Open tool</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div class="space-100"></div>
    </PageWrapper>
  );
}

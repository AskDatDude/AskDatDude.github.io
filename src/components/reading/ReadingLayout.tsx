import { useEffect, useRef, useState } from "preact/hooks";
import type { TableOfContentsItem } from "../../utils/markdown";
import { highlightCode } from "../../utils/prism";
import "./ReadingLayout.css";

interface ReadingLayoutProps {
  backHref: string;
  backLabel: string;
  tableOfContents: TableOfContentsItem[];
  html: string;
}

export function ReadingLayout({
  backHref,
  backLabel,
  tableOfContents,
  html,
}: ReadingLayoutProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [activeHeading, setActiveHeading] = useState(
    tableOfContents[0]?.id || "",
  );

  useEffect(() => {
    highlightCode(articleRef.current);
  }, [html]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article || tableOfContents.length === 0) return;

    const headings = tableOfContents
      .map((item) => article.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    let frame = 0;

    const updateActiveHeading = () => {
      frame = 0;
      const threshold = 170;
      let active = headings[0]?.id || "";

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= threshold) {
          active = heading.id;
        } else {
          break;
        }
      }

      setActiveHeading(active);
    };

    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateActiveHeading);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    updateActiveHeading();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [html, tableOfContents]);

  return (
    <section class="reading-layout">
      <aside class="reading-navigation">
        <a class="reading-back-link" href={backHref}>
          ← {backLabel}
        </a>
      </aside>

      <article
        ref={articleRef}
        class="reading-article"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <aside class="reading-toc" aria-label="Table of contents">
        <p class="reading-toc-title">On this page</p>
        <ol>
          {tableOfContents.map((item) => (
            <li
              key={item.id}
              class={activeHeading === item.id ? "is-active" : ""}
              data-level={item.level}
            >
              <a href={`#${item.id}`} title={item.text}>
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

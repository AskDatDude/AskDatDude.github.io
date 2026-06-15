import { describe, expect, it } from "bun:test";
import {
  extractTableOfContents,
  renderMarkdown,
  simpleMarkdownToHtml,
} from "../../src/utils/markdown";

describe("markdown utilities", () => {
  it("renders headings with stable unique ids", () => {
    const html = renderMarkdown("## Repeat\n\n## Repeat\n\n### Child");
    expect(html).toContain('id="repeat"');
    expect(html).toContain('id="repeat-2"');
    expect(html).toContain('id="child"');
  });

  it("builds a table of contents from level two and three headings", () => {
    const toc = extractTableOfContents(
      "# Ignored\n\n## Section\n\n### A very long heading ".repeat(8),
    );
    expect(toc[0]).toEqual({ id: "section", level: 2, text: "Section" });
    expect(toc.every((item) => item.level === 2 || item.level === 3)).toBe(true);
    expect(toc.at(-1)?.text.length).toBeLessThanOrEqual(72);
  });

  it("normalizes relative writing images while preserving absolute images", () => {
    const html = renderMarkdown(
      "![local](assets/example.png)\n\n![remote](https://example.com/a.png)",
      { assetBasePath: "/writing/entries/" },
    );
    expect(html).toContain('src="/writing/entries/assets/example.png"');
    expect(html).toContain('src="https://example.com/a.png"');
  });

  it("renders common markdown structures and escapes unsafe inline code", () => {
    const html = simpleMarkdownToHtml(
      "**bold** *italic* `</script>`\n\n- one\n- two\n\n[internal](/work)",
    );
    expect(html).toContain('class="markdown-strong"');
    expect(html).toContain('class="markdown-em"');
    expect(html).toContain("&lt;/script&gt;");
    expect(html).toContain('class="markdown-ul"');
    expect(html).toContain('href="/work"');
  });

  it("rejects unsafe image and link protocols", () => {
    const html = simpleMarkdownToHtml(
      "![bad](javascript:alert(1))\n\n[bad](javascript:alert(1))",
    );
    expect(html).not.toContain('src="javascript:');
    expect(html).not.toContain('href="javascript:');
  });
});

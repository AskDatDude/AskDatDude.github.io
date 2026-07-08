import { describe, expect, it } from "../test-api.ts";
import { parseFrontmatter } from "../../src/utils/frontmatter";

describe("parseFrontmatter", () => {
  it("parses strings, arrays, colons, and removes metadata from content", () => {
    const parsed = parseFrontmatter(`<!--- metadata
title: Example
summary: Value: with colon
tags: ["security", "web"]
buttons: [{"text":"Source","url":"https://example.com"}]
--->

# Body`);

    expect(parsed.metadata).toEqual({
      title: "Example",
      summary: "Value: with colon",
      tags: ["security", "web"],
      buttons: [{ text: "Source", url: "https://example.com" }],
    });
    expect(parsed.content).toBe("# Body");
  });

  it("returns untouched content when metadata is absent", () => {
    const raw = "# Plain document";
    expect(parseFrontmatter(raw)).toEqual({ metadata: {}, content: raw });
  });

  it("keeps malformed arrays as strings", () => {
    const parsed = parseFrontmatter(`<!--- metadata
tags: [invalid]
--->
Body`);
    expect(parsed.metadata.tags).toBe("[invalid]");
  });

  it("strips the alternate metadata comment syntax from content", () => {
    const parsed = parseFrontmatter(`<!-- metadata
title: Example
-->
Paragraph`);
    expect(parsed.metadata.title).toBe("Example");
    expect(parsed.content).toBe("Paragraph");
  });
});

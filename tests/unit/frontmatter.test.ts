import { describe, expect, it } from "bun:test";
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
});
